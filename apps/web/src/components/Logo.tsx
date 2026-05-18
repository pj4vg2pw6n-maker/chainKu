import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-[#111111] hover:text-accent transition-colors duration-150 no-underline"
    >
      {/* Three connected circles: smaller outer circles evoke 5-7-5 syllable structure */}
      <svg
        viewBox="0 0 35 12"
        width="35"
        height="12"
        aria-hidden="true"
        className="text-current"
      >
        <line
          x1="4"
          y1="6"
          x2="17.5"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="17.5"
          y1="6"
          x2="31"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="4"
          cy="6"
          r="3.5"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="17.5"
          cy="6"
          r="5"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="31"
          cy="6"
          r="3.5"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span className="font-sans font-semibold text-base tracking-tight">
        ChainKu
      </span>
    </Link>
  );
}
