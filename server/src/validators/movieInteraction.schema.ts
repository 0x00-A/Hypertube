import { z } from 'zod';

export const MovieIdParamSchema = z.object({
  params: z.object({
    movieId: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format'),
  }),
});

export const UpdateWatchProgressSchema = z.object({
  params: z.object({
    movieId: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format'),
  }),
  body: z.object({
    lastWatchedPosition: z.number().min(0, 'Position must be non-negative'),
    duration: z.number().min(1, 'Duration must be greater than 0'),
  }),
});

export const RateMovieSchema = z.object({
  params: z.object({
    movieId: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format'),
  }),
  body: z.object({
    rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating must be at most 10'),
  }),
});

export const LimitQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
  }),
});
