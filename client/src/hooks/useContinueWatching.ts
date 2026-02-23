import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../config/queryClient";
import { movieInteractionService } from "../services/movieInteraction.service";
import type { IWatchProgress } from "../types/movie.types";

const DEFAULT_LIMIT = 10;

export function useContinueWatching(enabled = true, limit = DEFAULT_LIMIT) {
  const { data, isLoading, isError, error } = useQuery<IWatchProgress[]>({
    queryKey: queryKeys.continueWatching.list(limit),
    queryFn: () => movieInteractionService.getContinueWatching(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes – refresh relatively often
    enabled,
  });

  return {
    continueWatching: data ?? [],
    isLoading,
    isError,
    error,
  };
}
