import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({
  className,
  size = "md",
  label = "Loading...",
  ...props
}: SpinnerProps) {
  const sizeClasses: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center gap-2 text-brand", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-current", sizeClasses[size])} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
