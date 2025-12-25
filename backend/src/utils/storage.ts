/**
 * File storage and management utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Delete a file
 */
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get file information
 */
export async function getFileInfo(filePath: string): Promise<{
  size: number;
  name: string;
  extension: string;
}> {
  const stats = await stat(filePath);
  const parsed = path.parse(filePath);

  return {
    size: stats.size,
    name: parsed.name,
    extension: parsed.ext,
  };
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSizeBytes: number): boolean {
  return fileSize <= maxSizeBytes;
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(fileSizeBytes: number): number {
  return fileSizeBytes / (1024 * 1024);
}

/**
 * Resolve path relative to project root
 */
export function resolveProjectPath(relativePath: string): string {
  // Go up from backend/ to project root
  const projectRoot = path.resolve(__dirname, '../..');
  return path.resolve(projectRoot, relativePath);
}

/**
 * Generate unique output directory name
 */
export function generateOutputDirName(): string {
  return `output_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate temporary audio file path for video extraction
 */
export function getTempAudioPath(videoPath: string): string {
  const parsed = path.parse(videoPath);
  const tempDir = path.join(path.dirname(videoPath), 'temp');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return path.join(tempDir, `${parsed.name}-extracted-${uniqueSuffix}.mp3`);
}

/**
 * Clean up multiple temporary files
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  const cleanupPromises = filePaths.map((filePath) => cleanupFile(filePath));
  await Promise.allSettled(cleanupPromises);
}

/**
 * Detect media type (audio or video) based on file extension
 */
export async function detectMediaType(filePath: string): Promise<'audio' | 'video'> {
  const ext = path.extname(filePath).toLowerCase();
  
  const videoExtensions = ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'];
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
  
  if (videoExtensions.includes(ext)) {
    return 'video';
  }
  
  if (audioExtensions.includes(ext)) {
    return 'audio';
  }
  
  // Default to audio if unknown (safer assumption)
  return 'audio';
}

