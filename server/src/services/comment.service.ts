import { CommentRepository } from '../repositories/comment.repository';

const repo = new CommentRepository();

export class CommentService {
  async list(page = 1, limit = 10) {
    return repo.findAll({ page, limit });
  }
  async create(input: any) {
    return repo.create(input);
  }
  async delete(id: string) {
    return repo.delete(id);
  }
}
