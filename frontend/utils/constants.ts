/**
 * Application constants and configuration
 */

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Polling configuration
export const POLLING_INTERVAL_MS = 2000; // Poll every 2 seconds
export const MAX_POLLING_ATTEMPTS = 300; // Max 10 minutes (300 * 2s)

// File upload configuration
export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Supported file types
export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'audio/x-m4a',
  'audio/m4a',
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime', // MOV files
  'video/x-msvideo', // AVI files
  'video/webm',
  'video/x-matroska', // MKV files
];

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_AUDIO_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
];

// File extensions
export const SUPPORTED_EXTENSIONS = [
  // Audio extensions
  '.mp3',
  '.wav',
  '.m4a',
  '.flac',
  '.ogg',
  '.aac',
  // Video extensions
  '.mp4',
  '.mpeg',
  '.mpg',
  '.mov',
  '.avi',
  '.webm',
  '.mkv',
];

// Error messages
export const ERROR_MESSAGES = {
  NO_FILE: 'Please select a file to upload',
  FILE_TOO_LARGE: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an audio file (MP3, WAV, M4A, etc.) or video file (MP4, MOV, AVI, etc.)',
  UPLOAD_FAILED: 'Failed to upload file. Please try again',
  PROCESSING_FAILED: 'Audio processing failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again',
  UPLOAD_RATE_LIMIT_EXCEEDED: 'Too many file uploads. Please wait before uploading another file',
  STATUS_RATE_LIMIT_EXCEEDED: 'Too many status checks. Please wait a moment',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later',
  FILE_UPLOAD_ERROR: 'Failed to upload file. Please check your file and try again',
  VALIDATION_ERROR: 'Invalid request. Please check your input',
  NOT_FOUND: 'Resource not found',
} as const;

/**
 * Map error codes to user-friendly messages
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  UPLOAD_RATE_LIMIT_EXCEEDED: ERROR_MESSAGES.UPLOAD_RATE_LIMIT_EXCEEDED,
  STATUS_RATE_LIMIT_EXCEEDED: ERROR_MESSAGES.STATUS_RATE_LIMIT_EXCEEDED,
  TIMEOUT_ERROR: ERROR_MESSAGES.TIMEOUT_ERROR,
  SERVICE_UNAVAILABLE: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  FILE_UPLOAD_ERROR: ERROR_MESSAGES.FILE_UPLOAD_ERROR,
  VALIDATION_ERROR: ERROR_MESSAGES.VALIDATION_ERROR,
  NOT_FOUND: ERROR_MESSAGES.NOT_FOUND,
  PROCESSING_ERROR: ERROR_MESSAGES.PROCESSING_FAILED,
  INTERNAL_ERROR: ERROR_MESSAGES.UNKNOWN_ERROR,
};

// Job status labels
export const JOB_STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  active: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  delayed: 'Delayed',
  waiting: 'Waiting',
};

