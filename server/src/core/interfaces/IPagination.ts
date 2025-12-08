import { IResponse } from './IResponse';

// 2. Pagination Request Options
export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 3. Filter Options (Extended for Movies)
export interface BaseFilterOptions {
  search?: string;
  isActive?: boolean;
}

// Specific filters for Movies
export interface MovieFilterOptions extends BaseFilterOptions {
  genres?: string[];
  genre?: string;
  minRating?: number;
  year?: number;
}

// 4. Paginated Response Structure
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
