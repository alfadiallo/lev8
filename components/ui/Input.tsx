import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Input component with theme-aware styling.
 * Uses CSS variables that automatically adapt to pastel/clinical themes.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    hint,
    className = '',
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
    const baseInputStyles = `
      w-full rounded-xl 
      border border-[var(--theme-border-solid)]
      bg-[var(--theme-surface-solid)]
      px-4 py-2.5 
      text-[var(--theme-text)] 
      placeholder:text-[var(--theme-text-muted)]
      focus:border-[var(--theme-primary)] 
      focus:ring-4 focus:ring-[var(--theme-primary-soft)] 
      focus:outline-none 
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim();
    
    const errorStyles = error ? `
      border-[var(--theme-error)] 
      focus:border-[var(--theme-error)] 
      focus:ring-red-100
    `.replace(/\s+/g, ' ').trim() : '';

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--theme-text)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input 
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${errorStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--theme-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[var(--theme-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea component with matching styling
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label,
    error,
    hint,
    className = '',
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
    const baseStyles = `
      w-full rounded-xl 
      border border-[var(--theme-border-solid)]
      bg-[var(--theme-surface-solid)]
      px-4 py-3 
      text-[var(--theme-text)] 
      placeholder:text-[var(--theme-text-muted)]
      focus:border-[var(--theme-primary)] 
      focus:ring-4 focus:ring-[var(--theme-primary-soft)] 
      focus:outline-none 
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      resize-none
    `.replace(/\s+/g, ' ').trim();
    
    const errorStyles = error ? `
      border-[var(--theme-error)] 
      focus:border-[var(--theme-error)] 
      focus:ring-red-100
    `.replace(/\s+/g, ' ').trim() : '';

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--theme-text)] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea 
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${errorStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--theme-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[var(--theme-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;



