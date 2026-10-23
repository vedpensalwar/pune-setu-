"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  const borderStyles: Record<ToastType, string> = {
    success: "border-status-success-border bg-surface text-content-primary",
    warning: "border-status-warning-border bg-surface text-content-primary",
    error: "border-status-error-border bg-surface text-content-primary",
    info: "border-status-info-border bg-surface text-content-primary",
  };

  const iconColors: Record<ToastType, string> = {
    success: "text-status-success",
    warning: "text-status-warning",
    error: "text-status-error",
    info: "text-status-info",
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container with ARIA live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((item) => {
          const Icon = icons[item.type];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-3.5 rounded-base border shadow-elevated transition-all duration-200",
                borderStyles[item.type]
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconColors[item.type])} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-content-primary">{item.title}</p>
                {item.message && (
                  <p className="text-xs text-content-secondary mt-0.5 leading-normal">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
                className="rounded-subtle p-1 text-content-muted hover:text-content-primary hover:bg-surface-hover shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
