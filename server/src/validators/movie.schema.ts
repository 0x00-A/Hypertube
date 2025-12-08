import { z } from 'zod';

export const MovieListQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1))
      .default(1)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .default(20)
      .optional(),
    search: z.string().max(255).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    sortBy: z.enum(['seeders', 'rating', 'releaseDate', 'title']).default('seeders').optional(),
  }),
});

export const MovieIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format') }),
});
