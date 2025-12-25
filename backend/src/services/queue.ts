/**
 * Job queue service for audio separation using BullMQ
 */

import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../utils/redis';
import { separateAudio } from './processor';
import { SeparationJobData, SeparationJobResult } from '../types/jobs';

// Queue configuration
const QUEUE_NAME = 'audio-separation';
const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY || '1', 10);
const JOB_ATTEMPTS = parseInt(process.env.JOB_RETRY_ATTEMPTS || '3', 10);
const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT_MS || '900000', 10); // 15 minutes default
const REMOVE_ON_COMPLETE = parseInt(process.env.JOB_RETENTION_HOURS || '24', 10) * 3600 * 1000; // Convert to ms

/**
 * Create BullMQ queue instance
 */
export const separationQueue = new Queue<SeparationJobData, SeparationJobResult>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: JOB_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.JOB_RETRY_DELAY_MS || '5000', 10),
    },
    removeOnComplete: {
      age: REMOVE_ON_COMPLETE,
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600 * 1000, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Create queue worker to process jobs
 */
export const separationWorker = new Worker<SeparationJobData, SeparationJobResult>(
  QUEUE_NAME,
  async (job: Job<SeparationJobData, SeparationJobResult>) => {
    const { inputPath, outputDir, jobId } = job.data;

    try {
      // Update progress: Job started
      await job.updateProgress(10);

      // Process audio with progress callbacks
      const result = await processWithProgress(job, inputPath, outputDir);

      // Update progress: Complete
      await job.updateProgress(100);

      return result;
    } catch (error) {
      // Update progress to indicate failure
      await job.updateProgress(-1);

      // Re-throw to trigger retry logic
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
    limiter: {
      max: 5, // Max 5 jobs per minute
      duration: 60000,
    },
  }
);

/**
 * Process audio with progress updates
 */
async function processWithProgress(
  job: Job<SeparationJobData, SeparationJobResult>,
  inputPath: string,
  outputDir: string
): Promise<SeparationJobResult> {
  // Update progress: File validated, starting processing
  await job.updateProgress(20);

  // Start processing (this is async, but we can't get real-time progress from Python)
  // We'll simulate progress updates based on estimated time
  const processingPromise = separateAudio(inputPath, outputDir);

  // Simulate progress updates (since Python script doesn't provide real-time progress)
  const progressInterval = setInterval(async () => {
    const state = await job.getState();
    if (state === 'active') {
      const currentProgressValue = job.progress;
      const currentProgress = typeof currentProgressValue === 'number' ? currentProgressValue : 0;
      if (currentProgress < 90) {
        // Gradually increase progress from 20% to 90%
        const newProgress = Math.min(currentProgress + 10, 90);
        await job.updateProgress(newProgress);
      }
    }
  }, 30000); // Update every 30 seconds

  try {
    const result = await processingPromise;
    clearInterval(progressInterval);

    if (result.status === 'success') {
      return result;
    } else {
      throw new Error(result.message || 'Processing failed');
    }
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

// Worker event handlers
separationWorker.on('completed', (job: Job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

separationWorker.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
  } else {
    console.error('❌ Job failed:', error.message);
  }
});

separationWorker.on('error', (error: Error) => {
  console.error('❌ Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down queue worker...');
  await separationWorker.close();
  await separationQueue.close();
  await redis.quit();
});

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<Job<SeparationJobData, SeparationJobResult> | null> {
  const job = await separationQueue.getJob(jobId);
  return job || null;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  result: SeparationJobResult | null;
  error?: string;
}> {
  const job = await getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  const state = await job.getState();
  const progressValue = job.progress;
  const progress = typeof progressValue === 'number' ? progressValue : 0;
  const returnValue = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
    result: returnValue || null,
    error: failedReason || undefined,
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    separationQueue.getWaitingCount(),
    separationQueue.getActiveCount(),
    separationQueue.getCompletedCount(),
    separationQueue.getFailedCount(),
    separationQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

