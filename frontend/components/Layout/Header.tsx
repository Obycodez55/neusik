/**
 * Header component for Neusik
 */

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Neusik
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Isolate vocals from music with AI
          </p>
        </div>
      </div>
    </header>
  );
}

