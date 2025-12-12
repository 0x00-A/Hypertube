import { ISignupDTO, ILoginDTO } from '../interfaces/auth.interface';
import { IUser } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { ConflictError } from '../core/errors/customErrors';

export class AuthService {

  constructor(
    private _userRepo: UserRepository,
    private _passwordService: PasswordService
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
    await this._userRepo.create({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    });
    // then you should send verification email
    return true;
  }

  async logIn(
    body: ILoginDTO,
  ): Promise<Partial<IUser> | null> {
    const user = body.identifier.includes('@')
      ? await this._userRepo.findByEmail(body.identifier)
      : await this._userRepo.findByUsername(body.identifier);
    if (!user || !user.password) {
      return null;
    }
    const isPasswordValid = await this._passwordService.verifyPassword(
      user.password!,
      body.password,
    );
    if (!isPasswordValid || !user._id) {
      return null;
    }
    // Remove password before returning user
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

}
