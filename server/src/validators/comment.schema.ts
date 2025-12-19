import z from 'zod';
import { TmdbIdParamSchema, tmdbIdBodySchema } from './movie.schema';
import { IdParamSchema } from './common.schema';

const paginationQuery = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  sortBy: z.enum(['createdAt']).default('createdAt'),
});

export const commentListQuerySchema = z.object({
  query: paginationQuery,
});

export const commentListByMovieQuerySchema = z.object({
  query: paginationQuery,
  params: z.object({
    tmdbId: TmdbIdParamSchema.shape.params.shape.tmdbId,
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500).trim(),
    tmdbId: tmdbIdBodySchema.shape.body.shape.tmdbId,
  }),
});

export const updateCommentSchema = z.object({
  params: IdParamSchema.shape.params,
  body: z.object({
    content: z.string().min(1).max(500).trim(),
  }),
});
