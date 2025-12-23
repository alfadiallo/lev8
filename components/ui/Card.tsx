import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Show gradient accent bar on top (visible on hover) */
  accent?: boolean;
  /** Make entire card clickable */
  onClick?: () => void;
  /** Disable hover effects */
  static?: boolean;
}

/**
 * Card component with theme-aware styling.
 * Uses CSS variables that automatically adapt to pastel/clinical themes.
 */
export function Card({ 
  children, 
  title, 
  subtitle, 
  className = '',
  accent = true,
  onClick,
  static: isStatic = false,
}: CardProps) {
  const isClickable = !!onClick;
  
  const baseStyles = `
    group relative overflow-hidden rounded-xl 
    bg-[var(--theme-surface-solid)] 
    border border-[var(--theme-border-solid)]
    shadow-[var(--theme-shadow)]
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim();
  
  const hoverStyles = isStatic ? '' : `
    hover:shadow-[var(--theme-shadow-lg)]
  `.replace(/\s+/g, ' ').trim();
  
  const clickableStyles = isClickable ? 'cursor-pointer' : '';
  
  const Component = isClickable ? 'button' : 'div';

  return (
    <Component 
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      type={isClickable ? 'button' : undefined}
    >
      {/* Accent Bar (visible on hover) */}
      {accent && !isStatic && (
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-[image:var(--theme-primary-gradient)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        />
      )}

      <div className="p-6">
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-[var(--theme-text)] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="text-[var(--theme-text)] leading-relaxed">
          {children}
        </div>
      </div>
    </Component>
  );
}

/**
 * Compact card variant for smaller UI elements
 */
export function CardCompact({ 
  children, 
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'div';
  
  return (
    <Component 
      className={`
        p-4 rounded-lg 
        bg-[var(--theme-surface-solid)] 
        border border-[var(--theme-border-solid)]
        shadow-[var(--theme-shadow)]
        hover:shadow-[var(--theme-shadow-lg)]
        transition-all duration-200
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      onClick={onClick}
      type={isClickable ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

export default Card;



