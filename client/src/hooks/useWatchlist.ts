import { useInfiniteQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';
import { useAppSelector } from '../redux/hooks';
import type { ApiError } from '../types/api.types';
import type { IMoviesResponse } from '../types/movie.types';

export const useWatchlist = () => {
    const filters = useAppSelector((state) => state.libraryFilters);

    return useInfiniteQuery<IMoviesResponse, ApiError>({
        queryKey: ['watchlist', filters],
        queryFn: ({ pageParam = 1 }) =>
            movieService.getWatchlist({
                page: pageParam,
                limit: 20,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                search: filters.search,
                genre: filters.genre !== 'All' ? filters.genre : undefined,
                minRating: filters.minRating > 0 ? filters.minRating : undefined,
                year: filters.year > 0 ? filters.year : undefined,
            }),
        getNextPageParam: (lastPage) => {
            const { pagination } = lastPage;
            return pagination.hasNextPage ? pagination.page + 1 : undefined;
        },
        initialPageParam: 1,
    });
};
