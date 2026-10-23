import React, { forwardRef, useId } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      id,
      label,
      description,
      error,
      required,
      disabled,
      options = [],
      placeholder,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const descriptionId = `${selectId}-desc`;
    const errorId = `${selectId}-error`;

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
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full h-10 appearance-none rounded-base border border-border bg-surface pl-3 pr-10 py-2 text-sm text-content-primary shadow-subtle transition-colors duration-150 cursor-pointer",
              "focus:outline-none focus:border-brand focus:ring-2 focus:ring-focus-ring",
              "disabled:bg-surface-muted disabled:text-content-muted disabled:cursor-not-allowed",
              error && "border-status-error focus:border-status-error focus:ring-status-error",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <div className="absolute right-3 flex items-center pointer-events-none text-content-secondary">
            {error ? (
              <AlertCircle className="w-4 h-4 text-status-error" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
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

Select.displayName = "Select";
