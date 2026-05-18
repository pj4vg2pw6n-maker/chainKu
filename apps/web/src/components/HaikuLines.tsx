interface Props {
  line1?: string;
  line2?: string | null;
  line3?: string | null;
  size?: "base" | "large";
  className?: string;
}

export function HaikuLines({
  line1,
  line2,
  line3,
  size = "base",
  className,
}: Props) {
  const textClass =
    size === "large"
      ? "font-serif text-2xl leading-relaxed"
      : "font-serif text-base leading-relaxed";

  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <p className={textClass}>
        {line1 ?? <span className="text-gray-muted select-none">—</span>}
      </p>
      <p className={textClass}>
        {line2 != null ? (
          line2
        ) : (
          <span className="text-gray-muted select-none">—</span>
        )}
      </p>
      <p className={textClass}>
        {line3 != null ? (
          line3
        ) : (
          <span className="text-gray-muted select-none">—</span>
        )}
      </p>
    </div>
  );
}
