import { MovieRepository } from '../repositories/movie.repository';

const repo = new MovieRepository();

export class MovieService {
  async list(page = 1, limit = 10) {
    return repo.findAll({ page, limit });
  }
  async get(id: string) {
    return repo.findById(id);
  }
}
