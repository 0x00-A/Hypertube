import { z } from 'zod';

export const StreamMovieParamSchema = z.object({
  params: z.object({
    movieId: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid movie ID format'),
  }),
});
