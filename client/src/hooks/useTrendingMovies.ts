import { useInfiniteQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import type { ApiError } from '../types/api.types';
import type { IMoviesResponse } from '../types/movie.types';

export const useTrendingMovies = () => {
  return useInfiniteQuery<IMoviesResponse, ApiError>({
    queryKey: ['trending-movies'],
    queryFn: ({ pageParam }) =>
      movieService.getTrendingMovies((pageParam as number) ?? 1),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
