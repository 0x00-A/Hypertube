import { z } from 'zod';

export const MovieListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default(1),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .default(20),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    sortBy: z.enum(['lastUpdated', 'rating', 'year', 'title']).default('lastUpdated'),
    search: z.string().max(255).trim().optional(),
    genre: z.string().max(100).trim().optional(),
    minRating: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform(Number)
      .pipe(z.number().min(0).max(10))
      .optional(),
    year: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear() + 1),
      )
      .optional(),
  }),
});

export const MovieIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format') }),
});

export const TmdbIdParamSchema = z.object({
  params: z.object({
    tmdbId: z
      .string()
      .regex(/^\d+$/, 'Invalid TMDB ID format')
      .transform(Number)
      .pipe(z.number().int().min(1)),
  }),
});

export const TmdbIdBodySchema = z.object({
  body: z.object({
    tmdbId: z.number().int().min(1),
  }),
});

export const MovieSearchQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default(1),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .default(20),
    sortOrder: z.enum(['desc', 'asc']).optional(),
    search: z.string().trim().min(1).max(255),
    genre: z.string().max(100).trim().optional(),
    minRating: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(0).max(10))
      .optional(),
    year: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear() + 1),
      )
      .optional(),
    sortBy: z.enum(['title', 'year', 'rating']).optional(),
  }),
});

export const MoviePageQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .trim()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1))
      .default(1),
  }),
});
