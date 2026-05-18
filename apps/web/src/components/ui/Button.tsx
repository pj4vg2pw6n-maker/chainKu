"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-light disabled:opacity-50",
  secondary:
    "border border-gray-border text-[#111111] bg-white hover:bg-gray-50 disabled:opacity-50",
  ghost: "text-accent hover:text-accent-light disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        "inline-flex items-center justify-center rounded-card font-medium font-sans",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .join(" ")
        .trim()}
      {...props}
    >
      {children}
    </button>
  );
});
