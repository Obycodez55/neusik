/**
 * Job types and interfaces for audio separation queue
 */

import { ProcessingResult } from '../services/processor';

/**
 * Job data structure passed to queue
 */
export interface SeparationJobData {
  inputPath: string;
  outputDir: string;
  jobId: string;
  userId?: string; // For future user accounts
  createdAt: number;
  originalFilename?: string;
  fileType?: 'audio' | 'video';
  extractedAudioPath?: string; // Path to extracted audio if original was video
}

/**
 * Job result structure stored in queue
 */
export interface SeparationJobResult extends ProcessingResult {
  // Extends ProcessingResult from processor service
  // Additional fields can be added here if needed
}

/**
 * Job status types
 */
export type JobStatus = 'queued' | 'active' | 'completed' | 'failed' | 'delayed' | 'waiting';

/**
 * Job status response structure
 */
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  result: SeparationJobResult | null;
  error?: string;
  createdAt?: number;
  completedAt?: number;
}

/**
 * Queue job options
 */
export interface QueueJobOptions {
  attempts?: number;
  delay?: number;
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

