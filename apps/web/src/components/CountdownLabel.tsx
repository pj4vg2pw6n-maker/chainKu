"use client";
import { useState, useEffect } from "react";

interface DeadlineLike {
  toMillis(): number;
}

interface Props {
  deadline: DeadlineLike | Date;
  className?: string;
}

function format(deadline: DeadlineLike | Date): string {
  const ms =
    deadline instanceof Date ? deadline.getTime() : deadline.toMillis();
  const diff = ms - Date.now();

  if (diff <= 0) return "closed";

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);

  if (hours >= 24) return `closes in ${Math.floor(hours / 24)}d`;
  if (hours > 0) return `closes in ${hours}h`;
  if (totalMinutes > 0) return `closes in ${totalMinutes}m`;
  return "closes soon";
}

export function CountdownLabel({ deadline, className }: Props) {
  const [label, setLabel] = useState(() => format(deadline));

  useEffect(() => {
    setLabel(format(deadline));
    const id = setInterval(() => setLabel(format(deadline)), 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    // suppressHydrationWarning because client time differs from build-time snapshot
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
