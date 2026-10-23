"use client";

import React from "react";
import { Sun, Moon, Contrast } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  className?: string;
  variant?: "pills" | "compact";
}

export function ThemeSelector({ className, variant = "pills" }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "high-contrast", label: "High Contrast", icon: Contrast },
  ];

  if (variant === "compact") {
    return (
      <div
        role="group"
        aria-label="Color Theme Options"
        className={cn(
          "inline-flex items-center rounded-base border border-border bg-surface p-1 shadow-subtle",
          className
        )}
      >
        {themes.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              aria-pressed={isActive}
              aria-label={`Switch to ${item.label} theme`}
              title={`${item.label} theme`}
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-subtle text-content-secondary transition-colors duration-150",
                "hover:text-content-primary hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring",
                isActive && "bg-brand text-brand-contrast hover:bg-brand-hover hover:text-brand-contrast"
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme Selection"
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 p-1 rounded-base border border-border bg-surface shadow-subtle",
        className
      )}
    >
      {themes.map((item) => {
        const Icon = item.icon;
        const isActive = theme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-subtle text-xs font-medium transition-all duration-150",
              "text-content-secondary hover:text-content-primary hover:bg-surface-hover",
              "focus-visible:ring-2 focus-visible:ring-focus-ring",
              isActive && "bg-brand text-brand-contrast shadow-subtle font-semibold hover:bg-brand-hover hover:text-brand-contrast"
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
