import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Button component with theme-aware styling.
 * Uses CSS variables that automatically adapt to pastel/clinical themes.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '',
    isLoading = false,
    disabled,
    ...props 
  }, ref) => {
    
    const baseStyles = `
      inline-flex items-center justify-center 
      rounded-xl font-medium 
      transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--theme-primary)]
      disabled:opacity-50 disabled:cursor-not-allowed 
      active:scale-[0.98]
    `.replace(/\s+/g, ' ').trim();
    
    const variants: Record<string, string> = {
      primary: `
        bg-[#0EA5E9] 
        text-white 
        shadow-md hover:shadow-lg hover:bg-[#0284C7] 
        border border-transparent
      `.replace(/\s+/g, ' ').trim(),
      
      secondary: `
        bg-[var(--theme-surface-solid)] 
        border border-[var(--theme-border-solid)] 
        text-[var(--theme-text)] 
        hover:bg-[var(--theme-surface-hover)] 
        shadow-sm
      `.replace(/\s+/g, ' ').trim(),
      
      ghost: `
        bg-transparent 
        text-[var(--theme-text-muted)] 
        hover:text-[var(--theme-primary)] 
        hover:bg-[var(--theme-primary-soft)]
      `.replace(/\s+/g, ' ').trim(),
      
      glass: `
        glass-panel 
        text-[var(--theme-text)] 
        hover:bg-white/40
      `.replace(/\s+/g, ' ').trim(),
      
      danger: `
        bg-[var(--theme-error)] 
        text-white 
        hover:brightness-110 
        shadow-sm
      `.replace(/\s+/g, ' ').trim(),
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button 
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;




