'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFile, formatFileSize } from '@/utils/validation';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
  isUploading?: boolean;
  error?: string | null;
}

export default function FileUpload({
  onFileSelect,
  selectedFile,
  disabled = false,
  isUploading = false,
  error: externalError = null,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Clear previous errors
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors) {
          const errorMessages = rejection.errors.map((e: any) => {
            if (e.code === 'file-too-large') {
              return 'File is too large. Maximum size is 100MB';
            }
            if (e.code === 'file-invalid-type') {
              return 'Invalid file type. Please upload an audio or video file';
            }
            return e.message || 'File rejected';
          });
          setError(errorMessages[0]);
          onFileSelect(null);
          return;
        }
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const validation = validateFile(file);

        if (validation.valid) {
          setError(null);
          onFileSelect(file);
        } else {
          setError(validation.error || 'Invalid file');
          onFileSelect(null);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'],
      'video/*': ['.mp4'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    disabled: disabled || isUploading,
  });

  const handleRemoveFile = () => {
    setError(null);
    onFileSelect(null);
  };

  const displayError = externalError || error;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }
          ${
            disabled || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-gray-400 dark:hover:border-gray-600'
          }
          ${displayError ? 'border-red-300 dark:border-red-700' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {formatFileSize(selectedFile.size)}
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove file
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {isDragActive
                ? 'Drop the file here'
                : 'Click to select or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              MP3, WAV, M4A, FLAC, OGG, AAC, MP4 (max 100MB)
            </p>
          </div>
        )}
      </div>

      {displayError && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {displayError}
        </div>
      )}
    </div>
  );
}

