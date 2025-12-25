'use client';

import { useState, useEffect, useRef } from 'react';
import { getJobStatus } from '@/lib/api';
import { JobStatus, JobStatusResponse, ProcessingResult } from '@/types';
import { POLLING_INTERVAL_MS, MAX_POLLING_ATTEMPTS } from '@/utils/constants';

interface UseJobStatusReturn {
  status: JobStatus;
  progress: number;
  error: string | null;
  result: ProcessingResult | null;
  isPolling: boolean;
}

export function useJobStatus(jobId: string | null): UseJobStatusReturn {
  const [status, setStatus] = useState<JobStatus>('queued');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset state when jobId changes
    if (!jobId) {
      setStatus('queued');
      setProgress(0);
      setError(null);
      setResult(null);
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      attemptsRef.current = 0;
      return;
    }

    // Reset attempts when new job starts
    attemptsRef.current = 0;
    setError(null);
    setIsPolling(true);

    const pollStatus = async () => {
      // Check maximum attempts
      if (attemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPolling(false);
        if (isMountedRef.current) {
          setError('Processing is taking longer than expected. Please try again later.');
        }
        return;
      }

      try {
        attemptsRef.current += 1;
        const response: JobStatusResponse = await getJobStatus(jobId);

        if (!isMountedRef.current) return;

        setStatus(response.status);
        setProgress(response.progress);

        // Handle completion
        if (response.status === 'completed') {
          setResult(response.result);
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // Handle failure
        else if (response.status === 'failed') {
          setError(response.error || 'Job processing failed');
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // Continue polling for active/queued states
        else {
          // Reset error if job is progressing
          if (error) {
            setError(null);
          }
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;

        // Handle network errors
        if (err instanceof Error) {
          // Don't stop polling on network errors, just log
          console.error('Polling error:', err.message);
          // Only set error if we've tried multiple times
          if (attemptsRef.current >= 5) {
            setError('Unable to check job status. Please refresh the page.');
          }
        } else {
          setError('An unexpected error occurred while checking job status.');
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    intervalRef.current = setInterval(pollStatus, POLLING_INTERVAL_MS);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [jobId]); // Removed 'error' from dependencies to prevent re-creating intervals

  return {
    status,
    progress,
    error,
    result,
    isPolling,
  };
}

