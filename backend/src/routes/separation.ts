/**
 * Audio separation API routes with job queue
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import { upload, isVideoFile } from '../utils/upload';
import { separationQueue, getJobStatus, getJob } from '../services/queue';
import { ensureDirectoryExists, generateOutputDirName, cleanupFile } from '../utils/storage';
import { ValidationError, NotFoundError, formatErrorResponse, getStatusCode, logError } from '../utils/errors';
import { SeparationJobData } from '../types/jobs';

const router = Router();

/**
 * POST /api/separation/process
 * Queue an audio separation job
 */
router.post('/process', upload.single('audio'), async (req: Request, res: Response) => {
  let inputFilePath: string | undefined;

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

    // Detect file type (audio or video)
    const fileType = isVideoFile(req.file.mimetype, req.file.originalname) ? 'video' : 'audio';

    // Create unique output directory
    const outputBaseDir = process.env.OUTPUT_DIR || 'outputs';
    await ensureDirectoryExists(outputBaseDir);
    const jobId = generateOutputDirName();
    const outputDir = path.join(outputBaseDir, jobId);

    // Create job data
    const jobData: SeparationJobData = {
      inputPath: inputFilePath,
      outputDir,
      jobId,
      createdAt: Date.now(),
      originalFilename: req.file.originalname,
      fileType,
    };

    // Add job to queue
    const job = await separationQueue.add(jobId, jobData, {
      jobId, // Use custom job ID
    });

    // Return job information immediately
    res.status(202).json({
      jobId: job.id,
      status: 'queued',
      statusUrl: `/api/separation/status/${job.id}`,
      downloadUrl: `/api/separation/download/${job.id}`,
    });
  } catch (error) {
    // Clean up file on error
    if (inputFilePath) {
      await cleanupFile(inputFilePath).catch(console.error);
    }

    logError(error, { endpoint: '/api/separation/process' });
    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCode(error);

    res.status(statusCode).json(errorResponse);
  }
});

/**
 * GET /api/separation/status/:jobId
 * Get job status and progress
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    res.json({
      jobId,
      status: status.status,
      progress: status.progress,
      result: status.result,
      error: status.error,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Job not found') {
      throw new NotFoundError('Job not found');
    }

    logError(error, { endpoint: '/api/separation/status', jobId: req.params.jobId });
    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCode(error);

    res.status(statusCode).json(errorResponse);
  }
});

/**
 * GET /api/separation/download/:jobId
 * Download processed audio file
 */
router.get('/download/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await getJob(jobId);

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const state = await job.getState();

    if (state !== 'completed') {
      throw new ValidationError(`Job is not completed. Current status: ${state}`);
    }

    const result = job.returnvalue;

    if (!result || result.status !== 'success' || !result.output) {
      throw new ValidationError('Job completed but no output file available');
    }

    const outputPath = result.output.path;

    // Send file for download
    res.download(outputPath, 'vocals.mp3', (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download file',
            code: 'DOWNLOAD_ERROR',
          });
        }
      }
    });
  } catch (error) {
    logError(error, { endpoint: '/api/separation/download', jobId: req.params.jobId });
    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCode(error);

    res.status(statusCode).json(errorResponse);
  }
});

export default router;
