import { ISignupDTO, ILoginDTO } from '../interfaces/auth.interface';
import { IUser } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { ConflictError } from '../core/errors/customErrors';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';

export class AuthService {
  constructor(
    private _userRepo: UserRepository,
    private _passwordService: PasswordService,
    private _emailService: EmailService,
  ) {}

  async signUp(userData: ISignupDTO) {
    const exist_username = await this._userRepo.existsByUsername(userData.username);
    const exist_email = await this._userRepo.existsByEmail(userData.email);
    if (exist_username) {
      throw new ConflictError('Username already taken');
    }
    if (exist_email) {
      throw new ConflictError('Email already exists');
    }
    const hashedPassword = await this._passwordService.hashPassword(userData.password);
    const user = await this._userRepo.create({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    });
    try {
      await this._emailService.createEmailToken(user, 'verification');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(
        { userId: user._id, email: user.email, err: errorMessage },
        'Failed to send verification email during signup',
      );
    }
    return true;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const verification = await this._emailService.verifyEmailToken(token);
    if (!verification) {
      throw new ConflictError('Invalid or expired verification token');
    }
    const user = await this._userRepo.findById(verification.userId);
    if (!user) {
      throw new ConflictError('User not found');
    }
    if (user.isActive) {
      throw new ConflictError('Email already verified');
    }
    await this._userRepo.update(user._id!, { isActive: true });
    await this._emailService.deleteVerificationToken(verification.token);
    try {
      await this._emailService.sendWelcomeEmail(user);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(
        { userId: user._id, email: user.email, err: errorMessage },
        'Failed to send welcome email',
      );
    }
    return true;
  }

  async logIn(body: ILoginDTO): Promise<Partial<IUser> | null> {
    const user = body.identifier.includes('@')
      ? await this._userRepo.findByEmailLogin(body.identifier)
      : await this._userRepo.findByUsernameLogin(body.identifier);
    if (!user || !user.password) {
      return null;
    }
    if (!user.isActive) {
      throw new ConflictError('Please verify your email before logging in');
    }
    const isPasswordValid = await this._passwordService.verifyPassword(
      user.password!,
      body.password,
    );
    if (!isPasswordValid || !user._id) {
      return null;
    }
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this._userRepo.findByEmailWithOauth(email);
    if (user) {
      if (user.oauth && !user.oauth.isPasswordSet) {
        throw new ConflictError(
          `Password reset is not available for ${user.oauth.provider} accounts`,
        );
      }
      try {
        await this._emailService.createEmailToken(user, 'password_reset');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error(
          { userId: user._id, email: user.email, err: errorMessage },
          'Failed to send password reset email',
        );
      }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const verification = await this._emailService.verifyPasswordResetToken(token);
    if (!verification) {
      throw new ConflictError('Invalid or expired password reset token');
    }
    const user = await this._userRepo.findById(verification.userId);
    if (!user) {
      throw new ConflictError('User not found');
    }
    const hashedPassword = await this._passwordService.hashPassword(newPassword);
    await this._userRepo.update(user._id!, { password: hashedPassword });
    // TODO[SECURITY]: Invalidate all existing refresh tokens for this user after password reset
    // once the refresh token storage/blacklisting mechanism is available, to ensure old sessions
    // cannot continue using previously issued tokens.
    await this._emailService.deleteVerificationToken(verification.token);
  }
}
