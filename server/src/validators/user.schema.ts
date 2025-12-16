import { z } from 'zod';

export const GetUserSchema = z.object({
  params: z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters long'),
  }),
});