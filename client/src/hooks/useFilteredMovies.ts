import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { movieService } from '../services/movie.service';
import type { IMovie, IPagination } from '../types/movie.types';

// ============================================================================
// Filtered Movies Hook
// ============================================================================

interface UseFilteredMoviesResult {
  movies: IMovie[];
  pagination: IPagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
}

export const useFilteredMovies = (): UseFilteredMoviesResult => {
  const filters = useAppSelector((state) => state.movieFilters);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMovies = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await movieService.getAllMovies({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        genre: filters.genre,
        minRating: filters.minRating,
        year: filters.year,
        page,
        limit: 20,
      });

      if (append) {
        setMovies((prev) => [...prev, ...response.data]);
      } else {
        setMovies(response.data);
      }

      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Refetch from page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchMovies(1, false);
  }, [fetchMovies]);

  const refetch = useCallback(async () => {
    await fetchMovies(1, false);
  }, [fetchMovies]);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNextPage) {
      await fetchMovies(currentPage + 1, true);
    }
  }, [fetchMovies, currentPage, pagination]);

  return {
    movies,
    pagination,
    isLoading,
    error,
    refetch,
    hasNextPage: pagination?.hasNextPage ?? false,
    loadMore,
  };
};
