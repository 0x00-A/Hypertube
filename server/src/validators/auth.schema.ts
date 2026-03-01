import { z } from 'zod';

export const SignUpSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters long').max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    firstName: z.string().trim().min(2, 'First name is required').max(10, 'First name must be less than 10 characters')
      .regex(/^[a-zA-Z]+$/, 'First name can only contain letters'),
    lastName: z.string().trim().min(2, 'Last name is required').max(10, 'Last name must be less than 10 characters')
      .regex(/^[a-zA-Z]+$/, 'Last name can only contain letters'),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  }),
});

export const VerifyEmailSchema = z.object({
  body: z.object({
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

export const RequestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  }),
});
