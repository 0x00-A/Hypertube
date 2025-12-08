import { MovieRepository } from '../repositories/movie.repository';

export class MovieService {
  private _movieRepsitory: MovieRepository;

  constructor(movieRepository: MovieRepository) {
    this._movieRepsitory = movieRepository;
  }

  async list(page = 1, limit = 10) {
    return this._movieRepsitory.findAll({ page, limit });
  }

  async get(id: string) {
    return this._movieRepsitory.findById(id);
  }
}
