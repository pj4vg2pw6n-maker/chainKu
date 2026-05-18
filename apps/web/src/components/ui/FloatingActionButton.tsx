import Link from "next/link";

interface Props {
  href: string;
  label?: string;
  children?: React.ReactNode;
}

export function FloatingActionButton({
  href,
  label = "New haiku",
  children,
}: Props) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "fixed bottom-6 right-6 z-50",
        "flex items-center justify-center w-14 h-14 rounded-full",
        "bg-accent text-white shadow-md",
        "hover:bg-accent-light transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      ].join(" ")}
    >
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )}
    </Link>
  );
}
