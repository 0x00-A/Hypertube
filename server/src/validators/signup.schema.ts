import { z } from 'zod';

export const SignUpSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters long'),
    firstName: z.string().trim().min(2, 'First name is required'),
    lastName: z.string().trim().min(2, 'Last name is required'),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});