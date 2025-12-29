import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';

/**
 * Hook to fetch available genres
 */
export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => movieService.getGenres(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};
