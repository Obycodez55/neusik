'use client';

import { useState, useRef, useEffect } from 'react';

export interface AudioPlayerProps {
  src: string | File | null;
  title?: string;
  showMetadata?: boolean;
  metadata?: {
    name?: string;
    size?: number;
    format?: string;
    duration?: number;
  };
  className?: string;
}

export default function AudioPlayer({
  src,
  title,
  showMetadata = true,
  metadata,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Check if source is a video file
  const isVideoFile = src instanceof File 
    ? src.type.startsWith('video/')
    : typeof src === 'string' && (src.includes('.mp4') || src.includes('.mov') || src.includes('.webm') || src.includes('.avi'));

  // Use video ref for video files, audio ref for audio files
  const videoRef = useRef<HTMLVideoElement>(null);

  // Create object URL if src is a File
  useEffect(() => {
    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (typeof src === 'string') {
      setAudioUrl(src);
    } else {
      setAudioUrl(null);
    }
  }, [src]);

  // Update current time
  useEffect(() => {
    const media = isVideoFile ? videoRef.current : audioRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => {
      setDuration(media.duration || 0);
      if (metadata && !metadata.duration) {
        // Update metadata duration if available
      }
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load audio');
    };
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('error', handleError);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('error', handleError);
      media.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, metadata, isVideoFile]);

  const togglePlayPause = () => {
    const media = isVideoFile ? videoRef.current : audioRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play().catch((err) => {
        console.error('Play error:', err);
        setError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = isVideoFile ? videoRef.current : audioRef.current;
    if (!media) return;

    const newTime = parseFloat(e.target.value);
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = isVideoFile ? videoRef.current : audioRef.current;
    if (!media) return;

    const newVolume = parseFloat(e.target.value);
    media.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!audioUrl) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No audio source available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls */}
      <div className="space-y-3">
        {/* Play/Pause and Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            disabled={isLoading || !!error}
            className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5"
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
            ) : isPlaying ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading || !!error || !duration}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`,
              }}
            />
          </div>

          <div className="flex-shrink-0 text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[35px]">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Metadata */}
      {showMetadata && metadata && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {metadata.name && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{metadata.name}</span>
              </div>
            )}
            {metadata.size !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Size:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatFileSize(metadata.size)}</span>
              </div>
            )}
            {metadata.format && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Format:</span>
                <span className="ml-2 text-gray-900 dark:text-white uppercase">{metadata.format}</span>
              </div>
            )}
            {(duration > 0 || metadata.duration) && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {formatTime(duration || metadata.duration || 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

