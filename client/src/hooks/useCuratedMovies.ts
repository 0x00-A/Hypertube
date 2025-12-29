import { useState, useCallback, useEffect } from 'react';
import { movieService } from '../services/movie.service';
import type { IMovie, IPagination } from '../types/movie.types';

/**
 * Curated movies filter options
 */
export interface ICuratedFilters {
  sort?: 'topRank' | 'rating' | 'year';
  genre?: string;
  minRating?: number;
  year?: number;
}

/**
 * Hook to fetch curated movies with infinite scroll support
 */
interface UseCuratedMoviesResult {
  movies: IMovie[];
  pagination: IPagination | null;
  isLoading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  refetch: (filters?: ICuratedFilters) => Promise<void>;
}

export const useCuratedMovies = (): UseCuratedMoviesResult => {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<ICuratedFilters>({});

  const fetchMovies = useCallback(async (
    page: number = 1, 
    append: boolean = false,
    filters: ICuratedFilters = {}
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await movieService.getCuratedMovies(page, 100, filters);

      if (append) {
        setMovies((prev) => [...prev, ...response.data]);
      } else {
        setMovies(response.data);
      }
      
      setPagination(response.pagination);
      setCurrentPage(page);
      setCurrentFilters(filters);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch curated movies';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMovies(1, false);
  }, [fetchMovies]);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNextPage && !isLoading) {
      await fetchMovies(currentPage + 1, true, currentFilters);
    }
  }, [fetchMovies, currentPage, pagination, isLoading, currentFilters]);

  const refetch = useCallback(async (filters: ICuratedFilters = {}) => {
    await fetchMovies(1, false, filters);
  }, [fetchMovies]);

  return {
    movies,
    pagination,
    isLoading,
    error,
    hasNextPage: pagination?.hasNextPage ?? false,
    loadMore,
    refetch,
  };
};
