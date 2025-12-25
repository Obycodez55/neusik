'use client';

import { useState } from 'react';
import Container from '@/components/Layout/Container';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Placeholder handlers - will be implemented in Phase 2
  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    // Will be implemented in Phase 2
    console.log('Upload handler - to be implemented');
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
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-600 dark:text-gray-400 mb-2">
                {file ? file.name : 'Click to select or drag and drop'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                MP3, WAV, M4A, FLAC, OGG, AAC, MP4 (max 100MB)
              </div>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </button>
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
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </Container>
  );
}
