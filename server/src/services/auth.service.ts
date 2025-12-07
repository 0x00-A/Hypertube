import { ISignupDTO, ILoginDTO, IUser } from "../interfaces/user.interface";
import { UserRepository } from "../repositories/user.repository";
import { PasswordService } from "./password.service";
import { JWTService } from "./jwt.service";



export class AuthService {
  private _repo;
  private _passwordService;
  private _jwtService;

  constructor(repo: UserRepository, passwordService: PasswordService, jwtService: JWTService) {
    this._repo = repo;
    this._passwordService = passwordService;
    this._jwtService = jwtService;
  }

  async signUp(userData: ISignupDTO) {
    const exist_username = await this._repo.findByUsername(userData.username);
    const exist_email = await this._repo.findByEmail(userData.email);
    if (exist_username) {
      throw new Error('Username already taken');
    }
    if (exist_email) {
      throw new Error('An email with this address already exists');
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

  async logIn(body: ILoginDTO): Promise<{ access_token: string; refresh_token: string; user: IUser } | null> {
    const user = await this._repo.findByUsername(body.identifier) || await this._repo.findByEmail(body.identifier);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this._passwordService.verifyPassword(user.password, body.password);
    if (!isPasswordValid) {
      return null;
    }
    const tokens = this._jwtService.generateTokens({ userId: user._id, email: user.email });
    return {
      ...tokens,
      user,
    };
  }
}