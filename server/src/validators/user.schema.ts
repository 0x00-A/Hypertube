import { z } from 'zod';

// Supported ISO 639-1 language codes
const SUPPORTED_LANGUAGES = [
  'en',
  'fr',
  'es',
  'de',
  'it',
  'pt',
  'ru',
  'ja',
  'zh',
  'ar',
  'nl',
  'sv',
  'no',
  'da',
  'fi',
  'pl',
  'tr',
  'ko',
  'hi',
] as const;
// type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const ListUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), 'Page must be a valid integer')
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(
        z
          .number()
          .int('Page must be an integer')
          .positive('Page must be a positive number')
          .max(10000, 'Page number too large'),
      ),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), 'Limit must be a valid integer')
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(
        z
          .number()
          .int('Limit must be an integer')
          .positive('Limit must be a positive number')
          .max(100, 'Limit cannot exceed 100'),
      ),
  }),
});

export const GetUserSchema = z.object({
  params: z.object({
    identifier: z.string().trim().min(3, 'Identifier must be at least 3 characters long'),
  }),
});

export const UpdateProfileSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').optional(),
    username: z.string().trim().min(3, 'Username must be at least 3 characters long').optional(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    avatarUrl: z.string().url('Invalid URL format').nullish(),
    language: z
      .enum(SUPPORTED_LANGUAGES, {
        message: 'Language must be a valid ISO 639-1 code',
      })
      .nullish(),
  }),
});

export const ChangePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters long'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
});