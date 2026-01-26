import { Request, Response, NextFunction } from 'express';
import { uploadAvatar } from '../config/multer';
import { BadRequestError } from '../core/errors/customErrors';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Middleware to handle avatar file uploads using multer
 * Attaches the uploaded file path to req.body.avatarUrl
 */
export const handleAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadAvatar.single('avatar');

  upload(req, res, (err: unknown) => {
    if (err) {
      // Handle multer errors
      if (err instanceof Error) {
        if (err.message.includes('File too large')) {
          return next(new BadRequestError('File size exceeds 5MB limit'));
        }
        return next(new BadRequestError(err.message));
      }
      return next(new BadRequestError('File upload failed'));
    }

    // If file was uploaded, construct the URL path
    if (req.file) {
      // Store the relative path that will be used in the database
      // This will be served as /uploads/avatars/filename.jpg
      req.body.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    next();
  });
};

/**
 * Helper function to delete old avatar file when updating
 * @param avatarPath - The database path (e.g., /uploads/avatars/filename.jpg)
 */
export const deleteOldAvatar = (avatarPath: string): void => {
  if (!avatarPath || avatarPath.startsWith('http')) {
    // Skip if no path or if it's an external URL (OAuth avatars, etc.)
    return;
  }

  try {
    // Convert database path to filesystem path
    const fullPath = path.join(__dirname, '../../', avatarPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    // Log but don't throw - deleting old avatar shouldn't break the update
    logger.error({ error, avatarPath }, 'Failed to delete old avatar');
  }
};
