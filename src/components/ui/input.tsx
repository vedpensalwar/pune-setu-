import React, { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      id,
      label,
      description,
      error,
      required,
      disabled,
      leftIcon,
      rightIcon,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-desc`;
    const errorId = `${inputId}-error`;

    const describedBy = [
      description ? descriptionId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-content-primary tracking-wide"
          >
            {label}
            {required && (
              <span className="text-status-error ml-1 font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-content-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full h-11 rounded-base border border-border bg-surface px-3.5 py-2.5 text-sm text-content-primary shadow-subtle transition-colors duration-150",
              "placeholder:text-content-muted",
              "focus:outline-none focus:border-brand focus:ring-2 focus:ring-focus-ring",
              "disabled:bg-surface-muted disabled:text-content-muted disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-status-error focus:border-status-error focus:ring-status-error",
              className
            )}
            {...props}
          />

          {rightIcon && !error && (
            <div className="absolute right-3 flex items-center pointer-events-none text-content-muted">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 flex items-center pointer-events-none text-status-error">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
            </div>
          )}
        </div>

        {description && !error && (
          <p id={descriptionId} className="text-xs text-content-secondary leading-normal">
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-status-error flex items-center gap-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
