import { IUser } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';


export class UserService {

  constructor(private _repo: UserRepository) {}

  async getUser(username: string, me=false): Promise<Partial<IUser> | null> {
    const user = await this._repo.findByUsername(username);
    if (!user) return null;

    if (!me) {
      // Exclude sensitive fields for other users
      // Never return email, oauth, or password for other users
      // (oauth and password are not selected by default)
      const { email, oauth, password, ...publicUser } = user;
      return publicUser;
    }

    return user;
  }
}
