import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-border mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 flex gap-6 text-sm text-gray-ui">
        <Link
          href="/privacy"
          className="hover:text-accent transition-colors duration-150"
        >
          Privacy policy
        </Link>
        <Link
          href="/contact"
          className="hover:text-accent transition-colors duration-150"
        >
          Contact
        </Link>
      </div>
    </footer>
  );
}
