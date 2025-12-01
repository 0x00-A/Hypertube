import { z } from 'zod';

export const objectIdString = () =>
  z
    .string()
    .min(1)
    .regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format');

export const IdParamSchema = z.object({
  params: z.object({ id: objectIdString() }),
});
