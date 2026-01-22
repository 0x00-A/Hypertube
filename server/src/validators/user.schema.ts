import { z } from 'zod';

// ISO 639-1 language codes supported by the application
const SUPPORTED_LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'ru', // Russian
  'ja', // Japanese
  'zh', // Chinese
  'ar', // Arabic
  'hi', // Hindi
  'ko', // Korean
  'nl', // Dutch
  'pl', // Polish
  'tr', // Turkish
  'sv', // Swedish
  'da', // Danish
  'fi', // Finnish
  'no', // Norwegian
  'cs', // Czech
  'ro', // Romanian
  'hu', // Hungarian
  'el', // Greek
  'th', // Thai
  'vi', // Vietnamese
  'id', // Indonesian
  'he', // Hebrew
  'fa', // Persian
] as const;

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
          .max(10000, 'Page number too large')
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
          .max(100, 'Limit cannot exceed 100')
      ),
  }),
});

export const GetUserSchema = z.object({
  params: z.object({
    identifier: z
      .string()
      .trim()
      .min(3, 'Identifier must be at least 3 characters long')
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
      .string()
      .refine(
        (val) => SUPPORTED_LANGUAGES.includes(val as (typeof SUPPORTED_LANGUAGES)[number]),
        {
          message: 'Language must be a valid ISO 639-1 code (e.g., en, fr, es, de)',
        },
      )
      .nullish(),
  }),
});