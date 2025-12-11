import { IResponse } from './IResponse';

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BaseFilterOptions {}

// Specific filters for Movies
export interface MovieFilterOptions extends BaseFilterOptions {
  search?: string;
  genre?: string;
  minRating?: number;
  year?: number;
}

// export interface YTSFilterOptions extends BaseFilterOptions {
//   queryTerm: string;
//   genre?: string;
//   minRating?: number;
//   year?: number;
//   quality?: '480p' | '720p' | '1080p' | '2160p' | '3D';
// }

export interface IPaginatedResponse<T> extends IResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
