import { useMutation, useQueryClient } from "@tanstack/react-query";
import { movieInteractionService } from "../services/movieInteraction.service";
import { queryKeys } from "../config/queryClient";
import type { IMovieInteraction } from "../types/movie.types";

interface UpdateWatchProgressParams {
  movieId: string;
  lastWatchedPosition: number;
  duration: number;
}

export const useUpdateWatchProgress = () => {
  const queryClient = useQueryClient();

  return useMutation<IMovieInteraction, Error, UpdateWatchProgressParams>({
    mutationFn: ({ movieId, lastWatchedPosition, duration }) =>
      movieInteractionService.updateWatchProgress(
        movieId,
        lastWatchedPosition,
        duration,
      ),

    onSuccess: () => {
      // Invalidate continue watching queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.continueWatching.all,
      });

      // Invalidate history queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.history.all,
      });
    },
  });
};
