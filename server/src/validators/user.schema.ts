import { z } from 'zod';

export const GetUserSchema = z.object({
  params: z.object({
    identifier: z
      .string()
      .trim()
      .min(3, 'Identifier must be at least 3 characters long')
      .refine(
        (val) => {
          // If it's 24 hex chars, it must be a valid MongoDB ObjectId format
          if (val.length === 24 && /^[0-9a-fA-F]{24}$/.test(val)) return true;
          // Otherwise, it must be a valid username (3+ chars, already validated by min(3))
          return val.length >= 3;
        },
        { message: 'Invalid user identifier format' }
      ),
  }),
});

// Legacy schemas kept for backward compatibility
export const GetUserByUsernameSchema = z.object({
  params: z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters long'),
  }),
});

export const GetUserByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().length(24, 'Invalid user ID format'),
  }),
});