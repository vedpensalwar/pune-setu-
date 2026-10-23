"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, type Language } from "./language-provider";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  variant?: "dropdown" | "pills";
}

export function LanguageSelector({ className, variant = "dropdown" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { id: Language; label: string; native: string }[] = [
    { id: "en", label: "English", native: "English" },
    { id: "mr", label: "Marathi", native: "मराठी" },
    { id: "hi", label: "Hindi", native: "हिन्दी" },
  ];

  const current = languages.find((l) => l.id === language) || languages[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (variant === "pills") {
    return (
      <div
        role="group"
        aria-label="Language options"
        className={cn(
          "inline-flex items-center rounded-base border border-border bg-surface p-1 shadow-subtle",
          className
        )}
      >
        {languages.map((item) => {
          const isActive = language === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id)}
              aria-pressed={isActive}
              className={cn(
                "px-2.5 py-1 rounded-subtle text-xs font-medium transition-colors duration-150",
                "text-content-secondary hover:text-content-primary hover:bg-surface-hover",
                isActive && "bg-brand text-brand-contrast font-semibold shadow-subtle"
              )}
            >
              {item.native}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Selected language: ${current.native}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-base border border-border bg-surface text-xs font-medium text-content-primary shadow-subtle hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <Globe className="w-3.5 h-3.5 text-content-secondary shrink-0" aria-hidden="true" />
        <span className="font-semibold">{current.native}</span>
        <ChevronDown className="w-3 h-3 text-content-muted shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-1.5 w-36 rounded-base border border-border bg-surface shadow-elevated py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {languages.map((item) => {
            const isSelected = language === item.id;
            return (
              <li key={item.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(item.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors",
                    "text-content-primary hover:bg-surface-hover",
                    isSelected && "font-bold text-brand bg-brand-surface/60"
                  )}
                >
                  <span>{item.native}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
