/**
 * API client for Neusik backend
 */

import axios, { AxiosError } from 'axios';
import { JobResponse, JobStatusResponse, ApiError } from '@/types';
import { ERROR_CODE_MESSAGES, ERROR_MESSAGES } from '@/utils/constants';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional - for adding auth tokens later)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const apiError = error.response.data;
      const errorCode = apiError?.code || 'UNKNOWN_ERROR';
      
      // Check for rate limit headers
      if (error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const message = ERROR_CODE_MESSAGES[errorCode] || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
        throw new Error(retryAfter ? `${message} (Retry after ${retryAfter} seconds)` : message);
      }
      
      // Use user-friendly message if available
      const userMessage = ERROR_CODE_MESSAGES[errorCode] || apiError?.error || ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(userMessage);
    } else if (error.request) {
      // Request made but no response
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Something else happened
      throw new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);

/**
 * Upload audio file and queue separation job
 */
export async function uploadFile(file: File): Promise<JobResponse> {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await api.post<JobResponse>('/api/separation/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Get job status and progress
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await api.get<JobStatusResponse>(`/api/separation/status/${jobId}`);
  return response.data;
}

/**
 * Download processed audio file
 */
export async function downloadFile(jobId: string): Promise<Blob> {
  const response = await api.get(`/api/separation/download/${jobId}`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Get download URL for a job
 */
export function getDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/api/separation/download/${jobId}`;
}

/**
 * Create object URL for original file preview
 */
export function getOriginalFileUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke object URL to free memory
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get processed file URL for preview
 * Same as download URL but can be used for audio preview
 */
export function getProcessedFileUrl(jobId: string): string {
  return getDownloadUrl(jobId);
}

/**
 * Get status URL for a job
 */
export function getStatusUrl(jobId: string): string {
  return `${API_BASE_URL}/api/separation/status/${jobId}`;
}

