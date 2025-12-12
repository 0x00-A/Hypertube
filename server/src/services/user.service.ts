import { UserRepository } from '../repositories/user.repository';


export class UserService {

  constructor(private _repo: UserRepository) {}

  async getUser(username: string) {
    const user = await this._repo.findByUsername(username);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
