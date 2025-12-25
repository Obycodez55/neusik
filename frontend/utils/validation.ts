/**
 * File validation utilities
 */

import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_EXTENSIONS,
  ERROR_MESSAGES,
} from './constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file size
 */
function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type (MIME type)
 */
function validateFileType(file: File): ValidationResult {
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    // Also check by extension as fallback (some browsers don't set MIME type correctly)
    const extension = getFileExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate file extension
 */
function validateFileExtension(file: File): ValidationResult {
  const extension = getFileExtension(file.name);
  
  if (!extension) {
    return {
      valid: false,
      error: 'File must have an extension',
    };
  }
  
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file name
 */
function validateFileName(file: File): ValidationResult {
  if (!file.name || file.name.trim().length === 0) {
    return {
      valid: false,
      error: 'File must have a name',
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File): ValidationResult {
  // Validate file name
  const nameValidation = validateFileName(file);
  if (!nameValidation.valid) {
    return nameValidation;
  }
  
  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Validate file extension
  const extensionValidation = validateFileExtension(file);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }
  
  // Validate file type (MIME type)
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return { valid: true };
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(file: File): boolean {
  return validateFile(file).valid;
}

