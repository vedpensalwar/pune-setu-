import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "subtle" | "base" | "full";
}

export function Skeleton({
  className,
  rounded = "base",
  ...props
}: SkeletonProps) {
  const roundedClasses: Record<string, string> = {
    subtle: "rounded-subtle",
    base: "rounded-base",
    full: "rounded-full",
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        "animate-pulse bg-surface-muted border border-border-subtle",
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
