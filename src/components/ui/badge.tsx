import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand" | "accent" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    neutral: "bg-surface-muted text-content-secondary border-border",
    brand: "bg-brand-surface text-brand border-brand/20",
    accent: "bg-accent-surface text-accent-deep border-accent/30",
    success: "bg-status-success-surface text-status-success border-status-success-border",
    warning: "bg-status-warning-surface text-status-warning border-status-warning-border",
    error: "bg-status-error-surface text-status-error border-status-error-border",
    info: "bg-status-info-surface text-status-info border-status-info-border",
  };

  const dotColors: Record<string, string> = {
    neutral: "bg-content-muted",
    brand: "bg-brand",
    accent: "bg-accent",
    success: "bg-status-success",
    warning: "bg-status-warning",
    error: "bg-status-error",
    info: "bg-status-info",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-subtle border font-medium select-none tracking-tight",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
