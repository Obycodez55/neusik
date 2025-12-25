'use client';

import AudioPlayer, { AudioPlayerProps } from './AudioPlayer';

export interface AudioComparisonProps {
  original: {
    src: string | File | null;
    metadata?: {
      name?: string;
      size?: number;
      format?: string;
      duration?: number;
    };
  };
  processed: {
    src: string | File | null;
    metadata?: {
      name?: string;
      size?: number;
      format?: string;
      duration?: number;
    };
  };
  className?: string;
}

export default function AudioComparison({
  original,
  processed,
  className = '',
}: AudioComparisonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Audio Comparison
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Audio */}
        <div>
          <AudioPlayer
            src={original.src}
            title="Original"
            showMetadata={true}
            metadata={original.metadata}
          />
        </div>

        {/* Processed Audio */}
        <div>
          <AudioPlayer
            src={processed.src}
            title="Isolated Vocals"
            showMetadata={true}
            metadata={processed.metadata}
          />
        </div>
      </div>
    </div>
  );
}

