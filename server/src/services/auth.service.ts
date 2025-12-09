import { ISignupDTO, ILoginDTO } from '../interfaces/auth.interface';
import { IUser } from '../interfaces/user.interface';
import { IJWTPayload } from '../interfaces/auth.interface';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { JWTService } from './jwt.service';
import { ConflictError } from '../core/errors/customErrors';

export class AuthService {
  private _repo: UserRepository;
  private _passwordService: PasswordService;
  private _jwtService: JWTService;

  constructor(repo: UserRepository, passwordService: PasswordService, jwtService: JWTService) {
    this._repo = repo;
    this._passwordService = passwordService;
    this._jwtService = jwtService;
  }

  async signUp(userData: ISignupDTO) {
    const exist_username = await this._repo.findByUsername(userData.username);
    const exist_email = await this._repo.findByEmail(userData.email);
    if (exist_username) {
      throw new ConflictError('Username already taken');
    }
    if (exist_email) {
      throw new ConflictError('Email already exists');
    }
    const hashedPassword = await this._passwordService.hashPassword(userData.password);
    const newUser: ISignupDTO = {
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    };
    const newUserCreated = await this._repo.create(newUser);
    // then you should send verification email
    return {
      userId: newUserCreated._id,
      username: newUserCreated.username,
      email: newUserCreated.email,
    };
  }

  async logIn(
    body: ILoginDTO,
  ): Promise<{ access_token: string; refresh_token: string; user: Partial<IUser> } | null> {
    const user = body.identifier.includes('@')
      ? await this._repo.findByEmail(body.identifier)
      : await this._repo.findByUsername(body.identifier);
    if (!user || !user.password) {
      return null;
    }
    const isPasswordValid = await this._passwordService.verifyPassword(
      user.password!,
      body.password,
    );
    if (!isPasswordValid) {
      return null;
    }
    if (!user._id) {
      return null;
    }
    const payload: IJWTPayload = { userId: user._id! };
    const tokens = this._jwtService.generateTokens(payload);

    // Remove password before returning user
    const { ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string } | null> {
    const verifyResult = await this._jwtService.verifyToken(refreshToken, false, true);
    if (!verifyResult.success) {
      return null;
    }
    return { access_token: verifyResult.newAccessToken! };
  }
}
