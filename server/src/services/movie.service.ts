import { MovieRepository } from '../repositories/movie.repository';
import { IPaginationOptions, MovieFilterOptions } from '../core/interfaces/IPagination';

export class MovieService {
  private _movieRepository: MovieRepository;

  constructor(movieRepository: MovieRepository) {
    this._movieRepository = movieRepository;
  }

  async list(paginationOptions: IPaginationOptions, filterOptions: MovieFilterOptions = {}) {
    return this._movieRepository.findAll(paginationOptions, filterOptions);
  }

  async get(id: string) {
    return this._movieRepository.findById(id);
  }
}
