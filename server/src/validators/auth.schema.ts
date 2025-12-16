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

export const VerifyEmailSchema = z.object({
  params: z.object({
    token: z.string().trim().min(1, 'Token is required'),
  }),
});

export const LogInSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1, 'Username or email is required').refine(
      (val) => {
        if (val.includes('@')) {
          return z.string().email().safeParse(val).success;
        }
        return val.length >= 3;
      },
      { message: 'Must be a valid email or username (min 3 characters)' }
    ),
    password: z.string().min(1, 'Password is required'),
  })
});
