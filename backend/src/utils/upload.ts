/**
 * Multer file upload configuration
 */

import multer from 'multer';
import path from 'path';
import { FileUploadError } from './errors';

// Allowed MIME types for audio/video files
const ALLOWED_MIME_TYPES = [
  // Audio types
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'audio/x-m4a',
  'audio/m4a',
  // Video types
  'video/mp4',
  'video/mpeg',
  'video/quicktime', // MOV files
  'video/x-msvideo', // AVI files
  'video/webm',
  'video/x-matroska', // MKV files
];

// Maximum file size (default 100MB)
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original name with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new FileUploadError(
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      ) as Error
    );
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

/**
 * Check if a file is a video file based on MIME type and filename
 */
export function isVideoFile(mimetype: string, filename: string): boolean {
  const videoMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
  ];
  
  if (videoMimeTypes.includes(mimetype)) {
    return true;
  }
  
  // Fallback: check file extension
  const ext = path.extname(filename).toLowerCase();
  const videoExtensions = ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'];
  return videoExtensions.includes(ext);
}

/**
 * Check if a file is an audio file based on MIME type and filename
 */
export function isAudioFile(mimetype: string, filename: string): boolean {
  const audioMimeTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/flac',
    'audio/ogg',
    'audio/aac',
    'audio/x-m4a',
    'audio/m4a',
  ];
  
  if (audioMimeTypes.includes(mimetype)) {
    return true;
  }
  
  // Fallback: check file extension
  const ext = path.extname(filename).toLowerCase();
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
  return audioExtensions.includes(ext);
}

// Export configuration constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};

