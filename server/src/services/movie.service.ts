import { MovieRepository } from '../repositories/movie.repository';
import { IPaginationOptions, MovieFilterOptions } from '../core/interfaces/IPagination';

export class MovieService {
  private _movieRepsitory: MovieRepository;

  constructor(movieRepository: MovieRepository) {
    this._movieRepsitory = movieRepository;
  }

  async list(options: IPaginationOptions & MovieFilterOptions) {
    return this._movieRepsitory.findAll(options);
  }

  async get(id: string) {
    return this._movieRepsitory.findById(id);
  }
}
