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
    return;
  }

  // Only allow paths under /uploads/avatars/
  if (!avatarPath.startsWith('/uploads/avatars/') && !avatarPath.startsWith('uploads/avatars/')) {
    logger.warn({ avatarPath }, 'Rejected avatar deletion attempt outside allowed directory');
    return;
  }

  // Normalize to a relative path so path.join resolves under the project root
  const normalizedAvatarPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  const fullPath = path.join(__dirname, '../../', normalizedAvatarPath);

  // Verify the resolved path is still under the uploads/avatars directory
  const uploadsDir = path.join(__dirname, '../../uploads/avatars');
  const resolvedPath = path.resolve(fullPath);
  const resolvedUploadsDir = path.resolve(uploadsDir);

  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    logger.error(
      { avatarPath, fullPath, resolvedPath, resolvedUploadsDir },
      'Path traversal attempt detected',
    );
    return;
  }

  fs.promises.unlink(fullPath).catch((error: unknown) => {
    logger.error({ error, avatarPath, fullPath }, 'Failed to delete old avatar');
  });
};
