import { CommentRepository } from '../repositories/comment.repository';
import { ICreateCommentDTO } from '../interfaces/comment.interface';
import { MovieRepository } from '../repositories/movie.repository';
import { NotFoundError, UnauthorizedError } from '../core/errors/customErrors';
import { Types } from 'mongoose';
import { MovieService } from './movie.service';
import { IPaginationOptions } from '../core/interfaces/IPagination';

export class CommentService {
  private _commentRepository: CommentRepository;
  private _movieRepository: MovieRepository;
  private _movieService: MovieService;

  constructor(
    commentRepository: CommentRepository,
    movieRepository: MovieRepository,
    movieService: MovieService,
  ) {
    this._commentRepository = commentRepository;
    this._movieRepository = movieRepository;
    this._movieService = movieService;
  }

  async list(tmdbId: number | undefined, paginationOptions: IPaginationOptions) {
    return this._commentRepository.findAll(tmdbId, paginationOptions);
  }

  async getById(id: string) {
    const comment = await this._commentRepository.findById(id);
    if (!comment) throw new NotFoundError('Comment not found');
    return comment;
  }

  async create(input: ICreateCommentDTO, userId: Types.ObjectId) {
    let movie = await this._movieRepository.findByTmdbId(input.tmdbId);
    if (!movie) {
      await this._movieService.completeMovieData(input.tmdbId);
      movie = await this._movieRepository.findByTmdbId(input.tmdbId);

      if (!movie) {
        throw new NotFoundError('Movie not found');
      }
    }
    return this._commentRepository.create(input, userId);
  }

  async update(id: string, content: string, userId: Types.ObjectId) {
    const existingComment = await this._commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found');
    }

    const existingCommentUserId =
      typeof existingComment.user === 'object' && existingComment.user !== null
        ? existingComment.user._id
        : existingComment.user;

    if (!existingCommentUserId.equals(userId)) {
      throw new UnauthorizedError('Unauthorized to update this comment');
    }

    return this._commentRepository.update(id, content);
  }

  async delete(id: string, userId: Types.ObjectId) {
    const existingComment = await this._commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found');
    }

    const existingCommentUserId =
      typeof existingComment.user === 'object' && existingComment.user !== null
        ? existingComment.user._id
        : existingComment.user;

    if (!existingCommentUserId.equals(userId)) {
      throw new UnauthorizedError('Unauthorized to delete this comment');
    }

    return this._commentRepository.delete(id);
  }
}
