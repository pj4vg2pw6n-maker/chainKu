"use client";
import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

const baseClass =
  "w-full rounded-input border border-gray-border bg-white px-3 py-2 " +
  "text-sm font-sans text-[#111111] placeholder:text-gray-muted " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "transition-colors duration-150 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input ref={ref} className={`${baseClass} ${className}`} {...props} />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseClass} resize-none ${className}`}
      {...props}
    />
  );
});
