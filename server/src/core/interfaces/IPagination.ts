import { IResponse } from './IResponse';

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BaseFilterOptions {
  search?: string;
  isActive?: boolean;
}

// Specific filters for Movies
export interface MovieFilterOptions extends BaseFilterOptions {
  genre?: string;
  minRating?: number;
  year?: number;
}

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
