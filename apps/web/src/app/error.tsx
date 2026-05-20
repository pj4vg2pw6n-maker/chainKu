"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="font-serif text-xl text-gray-muted mb-8">
        Something went wrong.
      </p>
      <button
        onClick={reset}
        className="text-sm font-medium font-sans text-accent hover:text-accent-light transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Try again
      </button>
    </div>
  );
}
