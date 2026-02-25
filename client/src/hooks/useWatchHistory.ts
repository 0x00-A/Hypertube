import { useInfiniteQuery } from "@tanstack/react-query";
import { movieInteractionService } from "../services/movieInteraction.service";
import { useAppSelector } from "../redux/hooks";
import type { ApiError } from "../types/api.types";
import type { IMoviesResponse } from "../types/movie.types";

export const useWatchHistory = () => {
  const filters = useAppSelector((state) => state.historyFilters);

  return useInfiniteQuery<IMoviesResponse, ApiError>({
    queryKey: ["history", filters],
    queryFn: ({ pageParam }) =>
      movieInteractionService.getWatchHistory({
        page: (pageParam as number) ?? 1,
        limit: 20,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search,
        genre: filters.genre !== "All" ? filters.genre : undefined,
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
