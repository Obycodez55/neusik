'use client';

import { useState } from 'react';
import Container from '@/components/Layout/Container';
import FileUpload from '@/components/Upload/FileUpload';
import { uploadFile } from '@/lib/api';
import { validateFile } from '@/utils/validation';
import { ERROR_MESSAGES } from '@/utils/constants';
import { JobResponse } from '@/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setUploadSuccess(false);
    // Reset job-related state when new file is selected
    if (selectedFile === null) {
      setJobId(null);
      setStatus('');
      setProgress(0);
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

    try {
      const response: JobResponse = await uploadFile(file);
      
      // Store job information
      setJobId(response.jobId);
      setStatus('queued');
      setProgress(0);
      setUploadSuccess(true);
      
      // Clear file selection after successful upload
      // Keep it visible for now, user can see what was uploaded
      
    } catch (err: unknown) {
      // Handle different error types
      if (err instanceof Error) {
        setError(err.message || ERROR_MESSAGES.UPLOAD_FAILED);
      } else {
        setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
      
      // Reset job state on error
      setJobId(null);
      setStatus('');
      setProgress(0);
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
            error={error && !isUploading ? error : null}
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
                ✓ File uploaded successfully! Job ID: {jobId}
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
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Status: {status || 'Queued'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your file is being processed. This may take a few minutes...
            </p>
          </div>
        )}

        {/* Download Section */}
        {downloadUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Download Result
            </h2>
            <a
              href={downloadUrl}
              download="vocals.mp3"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
            >
              Download Isolated Vocals
            </a>
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
