import { ISignupDTO, ILoginDTO } from '../interfaces/auth.interface';
import { IUser } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { ConflictError } from '../core/errors/customErrors';
import { EmailService } from './email.service';


export class AuthService {

  constructor(
    private _userRepo: UserRepository,
    private _passwordService: PasswordService,
    private _emailService: EmailService,
  ) {}

  async signUp(userData: ISignupDTO) {
    const exist_username = await this._userRepo.findByUsername(userData.username);
    const exist_email = await this._userRepo.findByEmail(userData.email);
    if (exist_username) {
      throw new ConflictError('Username already taken');
    }
    if (exist_email) {
      throw new ConflictError('Email already exists');
    }
    const hashedPassword = await this._passwordService.hashPassword(userData.password);
    const user =await this._userRepo.create({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    });
    await this._emailService.createVerificationEmail(user, 'verification');
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
    await this._emailService.sendWelcomeEmail(user);
    return true;
  }

  async logIn(
    body: ILoginDTO,
  ): Promise<Partial<IUser> | null> {
    const user = body.identifier.includes('@')
      ? await this._userRepo.findByEmail(body.identifier, true)
      : await this._userRepo.findByUsername(body.identifier, true);
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
    const user = await this._userRepo.findByEmail(email);
    if (user) {
      if (user.oauth && !user.oauth.isPasswordSet) {
        throw new ConflictError(`Password reset not available for ${user.oauth.provider} accounts`);
      }
      await this._emailService.createVerificationEmail(user, 'password_reset');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const verification = await this._emailService.verifyPasswordResetToken(token);
    if (!verification) {
      throw new ConflictError('Invalid or expired password reset token');
    }
    const user = await this._userRepo.findById(verification.userId, true);
    if (!user || !user.password) {
      throw new ConflictError('User not found');
    }
    const hashedPassword = await this._passwordService.hashPassword(newPassword);
    await this._userRepo.update(user._id!, { password: hashedPassword });
    await this._emailService.deleteVerificationToken(verification.token);
  }
}
