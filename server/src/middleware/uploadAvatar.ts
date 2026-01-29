import { Request, Response, NextFunction } from 'express';
import { uploadAvatar } from '../config/multer';
import { BadRequestError } from '../core/errors/customErrors';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export const handleAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadAvatar.single('avatar');

  upload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof Error) {
        if (err.message.includes('File too large')) {
          return next(new BadRequestError('File size exceeds 5MB limit'));
        }
        return next(new BadRequestError(err.message));
      }
      return next(new BadRequestError('File upload failed'));
    }

    if (req.file) {
      req.body.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    next();
  });
};

export const deleteOldAvatar = (avatarPath: string): void => {
  if (!avatarPath || avatarPath.startsWith('http')) {
    // no path or if it's an external URL (OAuth avatars, etc.)
    return;
  }

  // Normalize to a relative path so path.join resolves under the project root
  const normalizedAvatarPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  const fullPath = path.join(__dirname, '../../', normalizedAvatarPath);

  // Fire-and-forget asynchronous deletion to avoid blocking the event loop
  fs.promises.unlink(fullPath).catch((error: unknown) => {
    // Log but don't throw - deleting old avatar shouldn't break the update
    logger.error({ error, avatarPath, fullPath }, 'Failed to delete old avatar');
  });
};
