import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="font-serif text-2xl text-gray-muted mb-8">
        Page not found.
      </p>
      <Link
        href="/"
        className="text-sm font-medium font-sans text-accent hover:text-accent-light transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Back to home
      </Link>
    </div>
  );
}
