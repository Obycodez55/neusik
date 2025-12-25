'use client';

interface ErrorDisplayProps {
  error: string | null;
  title?: string;
  className?: string;
}

export default function ErrorDisplay({ error, title = 'Error', className = '' }: ErrorDisplayProps) {
  if (!error) return null;

  const isRateLimit = error.toLowerCase().includes('rate limit') || 
                      error.toLowerCase().includes('too many');

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-800 dark:text-red-200 font-medium mb-1">{title}</p>
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          {isRateLimit && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-2">
              💡 Tip: Please wait a few moments before trying again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

