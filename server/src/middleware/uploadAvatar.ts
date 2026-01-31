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

  try {
    // Convert database path to filesystem path
    const fullPath = path.join(__dirname, '../../', avatarPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    logger.error({ error, avatarPath }, 'Failed to delete old avatar');
  }
};
