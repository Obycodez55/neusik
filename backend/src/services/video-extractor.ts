/**
 * Video to audio extraction service using FFmpeg
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { ProcessingError } from '../utils/errors';

export interface ExtractionResult {
  audioPath: string;
  duration?: number;
  bitrate?: number;
}

/**
 * Check if FFmpeg is available in the system
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'], {
      stdio: 'pipe',
    });

    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      ffmpeg.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Extract audio from video file using FFmpeg
 * 
 * @param videoPath - Path to input video file
 * @param outputPath - Path where extracted audio will be saved
 * @returns Promise resolving to extraction result with audio path
 * @throws ProcessingError if extraction fails
 */
export async function extractAudioFromVideo(
  videoPath: string,
  outputPath: string
): Promise<ExtractionResult> {
  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    throw new ProcessingError('FFmpeg is not available. Video extraction cannot be performed.', {
      error_type: 'FFMPEG_NOT_FOUND',
    });
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    // FFmpeg command to extract audio:
    // -i: input file
    // -vn: disable video stream
    // -acodec libmp3lame: use MP3 codec
    // -ab 256k: set audio bitrate to 256kbps (matches Demucs output)
    // -y: overwrite output file if it exists
    // -loglevel error: only show errors
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'libmp3lame', // MP3 codec
      '-ab', '256k', // Audio bitrate
      '-y', // Overwrite output
      '-loglevel', 'error', // Only errors
      outputPath,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'], // stdin: ignore, stdout: pipe, stderr: pipe
    });

    let errorOutput = '';
    let standardOutput = '';

    ffmpeg.stdout.on('data', (data) => {
      standardOutput += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        // Verify output file exists and is valid
        try {
          const stats = await fs.stat(outputPath);
          if (stats.size === 0) {
            await fs.unlink(outputPath).catch(() => {});
            reject(
              new ProcessingError('Extracted audio file is empty', {
                error_type: 'EXTRACTION_FAILED',
                ffmpeg_stderr: errorOutput,
              })
            );
            return;
          }

          resolve({
            audioPath: outputPath,
          });
        } catch (error) {
          reject(
            new ProcessingError('Extracted audio file not found after extraction', {
              error_type: 'EXTRACTION_FAILED',
              ffmpeg_stderr: errorOutput,
              file_error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      } else {
        // FFmpeg failed
        reject(
          new ProcessingError('Failed to extract audio from video', {
            error_type: 'EXTRACTION_FAILED',
            exit_code: code,
            ffmpeg_stderr: errorOutput,
            ffmpeg_stdout: standardOutput,
          })
        );
      }
    });

    ffmpeg.on('error', (error) => {
      reject(
        new ProcessingError('Failed to spawn FFmpeg process', {
          error_type: 'FFMPEG_SPAWN_ERROR',
          error: error.message,
        })
      );
    });
  });
}

/**
 * Detect if a file is a video file based on extension
 */
export function isVideoFileByExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const videoExtensions = ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'];
  return videoExtensions.includes(ext);
}

