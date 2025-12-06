import { ICreateUserDTO } from "../interfaces/user.interface";
import { UserRepository } from "../repositories/user.repository";
import { PasswordService } from "./password.service";


const repo = new UserRepository();
const passwordService = new PasswordService();

export class AuthService {

  async signUp(userData: any) {
    const exist_username = await repo.findByUsername(userData.username);
    const exist_email = await repo.findByEmail(userData.email);
    if (exist_username) {
      throw new Error('Username already taken');
    }
    if (exist_email) {
      throw new Error('An email with this address already exists');
    }
    const hashedPassword = await passwordService.hashPassword(userData.password);
    const newUser: ICreateUserDTO = {
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    };
    // then you should send verification email
    return repo.create(newUser);
  }
}