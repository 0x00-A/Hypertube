import { UserRepository } from '../repositories/user.repository';

const repo = new UserRepository();

export class UserService {
  async list(page = 1, limit = 10) {
    return repo.findAll({ page, limit });
  }
  async get(id: string) {
    return repo.findById(id);
  }
  async patch(id: string, patch: any) {
    return repo.updatePartial(id, patch);
  }
}
