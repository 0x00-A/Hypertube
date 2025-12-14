import { IUser } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';


export class UserService {

  constructor(private _repo: UserRepository) {}

  async getUser(username: string, me=false): Promise<Partial<IUser> | null> {
    const user = await this._repo.findByUsername(username);
    if (!user) return null;

    if (!me) {
      delete user.email;
      delete user.oauth;
    }

    return user;
  }
}
