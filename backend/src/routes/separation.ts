/**
 * Audio separation API routes
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import { upload } from '../utils/upload';
import { separateAudio } from '../services/processor';
import { ensureDirectoryExists, generateOutputDirName, cleanupFile } from '../utils/storage';
import { ValidationError, ProcessingError, formatErrorResponse, getStatusCode, logError } from '../utils/errors';

const router = Router();

/**
 * POST /api/separation/process
 * Process audio file to separate vocals
 */
router.post('/process', upload.single('audio'), async (req: Request, res: Response) => {
  let inputFilePath: string | undefined;
  let outputDir: string | undefined;

  try {
    // Validate file upload
    if (!req.file) {
      throw new ValidationError('No audio file uploaded. Please provide a file with field name "audio".');
    }

    inputFilePath = req.file.path;
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10) * 1024 * 1024;

    // Validate file size
    if (req.file.size > maxFileSize) {
      await cleanupFile(inputFilePath);
      throw new ValidationError(
        `File too large: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${maxFileSize / (1024 * 1024)}MB`
      );
    }

    // Create unique output directory
    const outputBaseDir = process.env.OUTPUT_DIR || 'outputs';
    await ensureDirectoryExists(outputBaseDir);
    outputDir = path.join(outputBaseDir, generateOutputDirName());

    // Process audio
    const result = await separateAudio(inputFilePath, outputDir);

    if (result.status === 'success' && result.output) {
      const outputPath = result.output.path;

      // Send file for download
      res.download(outputPath, 'vocals.mp3', async (err) => {
        // Clean up files after download
        if (inputFilePath) {
          await cleanupFile(inputFilePath).catch(console.error);
        }
        // Clean up output directory (optional - could keep for a period)
        // await cleanupFile(outputPath).catch(console.error);

        if (err) {
          console.error('Download error:', err);
        }
      });
    } else {
      // Clean up input file on error
      if (inputFilePath) {
        await cleanupFile(inputFilePath).catch(console.error);
      }

      throw new ProcessingError(
        result.message || 'Audio processing failed',
        {
          error_type: result.error_type,
        }
      );
    }
  } catch (error) {
    // Clean up files on error
    if (inputFilePath) {
      await cleanupFile(inputFilePath).catch(console.error);
    }

    logError(error, { endpoint: '/api/separation/process' });
    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCode(error);

    res.status(statusCode).json(errorResponse);
  }
});

export default router;

