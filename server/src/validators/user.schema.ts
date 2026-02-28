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
    id: z.string().trim().min(3, 'Identifier must be at least 3 characters long'),
  }),
});

export const UpdateProfileSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    email: z.string().trim().email('Invalid email address').optional(),
    username: z.string().trim().min(3, 'Username must be at least 3 characters long').optional(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    // avatarUrl can be either a file path (from multer) or an external URL
    avatarUrl: z
      .string()
      .refine(
        (val) => {
          // Reject any path traversal attempts
          if (val.includes('..') || val.includes('\\')) {
            return false;
          }

          // Only allow paths under /uploads/avatars/ (from multer)
          if (val.startsWith('/uploads/avatars/') || val.startsWith('uploads/avatars/')) {
            return true;
          }

          // Otherwise validate as external URL (for OAuth avatars)
          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        { message: 'Invalid URL format' },
      )
      .nullish(),
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
