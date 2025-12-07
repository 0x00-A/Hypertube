import { ISignupDTO } from "../interfaces/user.interface";
import { UserRepository } from "../repositories/user.repository";
import { PasswordService } from "./password.service";


export class AuthService {
  private _repo;
  private _passwordService;

  constructor(repo: UserRepository, passwordService: PasswordService) {
    this._repo = repo;
    this._passwordService = passwordService;
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
}