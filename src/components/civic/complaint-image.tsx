"use client";

import React, { useState } from "react";
import { CameraOff, Image as ImageIcon } from "lucide-react";

export interface ComplaintImageProps {
  /** Source URL of the complaint photo or evidence thumbnail */
  src?: string | null;
  /** Meaningful accessibility alternative text */
  alt: string;
  /** Classes applied to the stable outer container (default: w-20 h-20) */
  className?: string;
  /** Classes applied to the inner image element (default: w-full h-full object-cover) */
  imageClassName?: string;
  /** Text shown when photo cannot be retrieved or is missing */
  fallbackText?: string;
  /** Whether to render textual fallback alongside the icon */
  showFallbackText?: boolean;
  /** Compact presentation mode for small cards or tables */
  compact?: boolean;
}

/**
 * Robust, accessible Complaint Image component for PuneSetu.
 *
 * Guarantees:
 * 1. Stable container dimensions preventing card collapse and layout shifts.
 * 2. Catches missing/broken image files immediately and renders a polished
 *    civic "Photo unavailable" fallback instead of browser broken-image icons.
 * 3. Prevents long alternative text from overflowing containers as oversized text.
 * 4. Cancels failed image requests and prevents repeated network retries.
 * 5. Full WCAG accessibility via semantic role and aria-label.
 */
export function ComplaintImage({
  src,
  alt,
  className = "w-20 h-20",
  imageClassName = "w-full h-full object-cover",
  fallbackText = "Photo unavailable",
  showFallbackText = true,
  compact = false,
}: ComplaintImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  // Reset state during render if source URL changes
  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
    setIsLoading(Boolean(src));
  }

  // Fallback presentation when photo is missing or failed to retrieve
  if (!src || hasError) {
    return (
      <div
        className={`rounded-base border border-border bg-surface-muted flex flex-col items-center justify-center p-1.5 select-none text-content-muted shrink-0 overflow-hidden ${className}`}
        role="img"
        aria-label={alt ? `${fallbackText}: ${alt}` : fallbackText}
        title={fallbackText}
      >
        <CameraOff
          className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-content-muted/60 shrink-0 mb-1`}
          aria-hidden="true"
        />
        {showFallbackText && (
          <span className="text-[10px] sm:text-[11px] font-medium text-content-muted text-center leading-tight line-clamp-2 px-1">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-base border border-border bg-surface-muted shrink-0 overflow-hidden relative ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${imageClassName} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-150`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface-muted animate-pulse"
          aria-hidden="true"
        >
          <ImageIcon className="w-5 h-5 text-content-muted/40" />
        </div>
      )}
    </div>
  );
}
