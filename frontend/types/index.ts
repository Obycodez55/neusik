/**
 * TypeScript type definitions for Neusik frontend
 */

/**
 * Job status types
 */
export type JobStatus = 'queued' | 'active' | 'completed' | 'failed' | 'delayed' | 'waiting';

/**
 * Job response from upload endpoint
 */
export interface JobResponse {
  jobId: string;
  status: 'queued';
  statusUrl: string;
  downloadUrl: string;
}

/**
 * Processing result from Python script
 */
export interface ProcessingResult {
  status: 'success' | 'error';
  input?: {
    path: string;
    name: string;
    size: number;
    format: string;
  };
  output?: {
    path: string;
    size: number;
    format: string;
  };
  videoOutput?: {
    path: string;
    size: number;
    format: string;
  };
  processing?: {
    time_seconds: number;
    model: string;
  };
  message?: string;
  error_type?: string;
  warnings?: string[];
  originalFileType?: 'audio' | 'video';
}

/**
 * Job status response from status endpoint
 */
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  result: ProcessingResult | null;
  error?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Audio metadata for preview
 */
export interface AudioMetadata {
  name?: string;
  size?: number;
  format?: string;
  duration?: number;
}

/**
 * Audio player props
 */
export interface AudioPlayerProps {
  src: string | File | null;
  title?: string;
  showMetadata?: boolean;
  metadata?: AudioMetadata;
  className?: string;
}

