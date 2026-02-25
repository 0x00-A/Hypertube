import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError } from '../core/errors/customErrors';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Save files to uploads/avatars directory
    cb(null, path.join(process.cwd(), 'uploads/avatars'));
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: uuid-timestamp.extension
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// File filter to accept only images
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept only image files
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
};

// Configure multer
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
