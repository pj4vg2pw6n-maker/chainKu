import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-card border border-gray-border bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
