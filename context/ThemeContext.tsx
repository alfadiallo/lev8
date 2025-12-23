'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Default to 'clinical' as we've made it the main theme
export type Theme = 'clinical';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isClinical: boolean;
  isPastel: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider - Simplified for Clinical Clean default
 * 
 * Note: Theme switching logic has been removed as Clinical Clean is now the standard.
 * We keep the provider structure to minimize refactoring in consuming components.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Static theme state
  const theme: Theme = 'clinical';
  
  // No-op functions for compatibility
  const setTheme = () => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        toggleTheme,
        isClinical: true,
        isPastel: false
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}



