import { z } from 'zod';

export const MovieListQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : undefined)),
  }),
});

export const MovieIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format') }),
});
