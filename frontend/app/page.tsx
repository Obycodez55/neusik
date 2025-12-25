'use client';

import { useState, useEffect } from 'react';
import Container from '@/components/Layout/Container';
import FileUpload from '@/components/Upload/FileUpload';
import ProgressBar from '@/components/Progress/ProgressBar';
import { uploadFile, getDownloadUrl } from '@/lib/api';
import { validateFile } from '@/utils/validation';
import { ERROR_MESSAGES } from '@/utils/constants';
import { JobResponse, JobStatus } from '@/types';
import { useJobStatus } from '@/hooks/useJobStatus';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Use polling hook for job status
  const { status, progress, error: pollingError, result, isPolling } = useJobStatus(jobId);

  // Handle job completion
  useEffect(() => {
    if (status === 'completed' && result && jobId) {
      // Set download URL when job completes
      setDownloadUrl(getDownloadUrl(jobId));
      setError(null);
    } else if (status === 'failed') {
      // Handle job failure
      if (pollingError) {
        setError(pollingError);
      }
    }
  }, [status, result, jobId, pollingError]);

  // Combine upload errors with polling errors
  useEffect(() => {
    if (pollingError && status !== 'completed') {
      setError(pollingError);
    }
  }, [pollingError, status]);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setUploadSuccess(false);
    // Reset job-related state when new file is selected
    if (selectedFile === null) {
      setJobId(null);
      setDownloadUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(ERROR_MESSAGES.NO_FILE);
      return;
    }

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);
    setDownloadUrl(null);

    try {
      const response: JobResponse = await uploadFile(file);
      
      // Store job information
      setJobId(response.jobId);
      setUploadSuccess(true);
      
    } catch (err: unknown) {
      // Handle different error types
      if (err instanceof Error) {
        setError(err.message || ERROR_MESSAGES.UPLOAD_FAILED);
      } else {
        setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
      
      // Reset job state on error
      setJobId(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Audio File
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select an audio or video file to separate vocals from background music
          </p>
          
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={file}
            disabled={isUploading || !!jobId}
            isUploading={isUploading}
            error={error && !isUploading && !jobId ? error : null}
          />

          <button
            onClick={handleUpload}
            disabled={!file || isUploading || !!jobId}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload & Process'
            )}
          </button>

          {uploadSuccess && jobId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ File uploaded successfully! Processing started...
              </p>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {jobId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Processing Status
            </h2>
            
            <ProgressBar progress={progress} status={status as JobStatus} />
            
            <div className="mt-4">
              {status === 'queued' && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your file is queued and will start processing shortly...
                </p>
              )}
              {status === 'active' && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your file is being processed. This may take a few minutes...
                </p>
              )}
              {status === 'completed' && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Processing completed successfully!
                </p>
              )}
              {status === 'failed' && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ✗ Processing failed. Please try again.
                </p>
              )}
              {isPolling && status !== 'completed' && status !== 'failed' && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Checking status...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Download Section */}
        {downloadUrl && status === 'completed' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Download Result
            </h2>
            <a
              href={downloadUrl}
              download="vocals.mp3"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Isolated Vocals
            </a>
            {result?.output && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                File size: {Math.round((result.output.size || 0) / 1024 / 1024 * 100) / 100} MB
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && !isUploading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
