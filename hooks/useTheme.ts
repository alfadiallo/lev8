'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export type Theme = 'pastel' | 'clinical';

const THEME_STORAGE_KEY = 'lev8-theme';

/**
 * Hook to manage theme state based on URL parameter or sessionStorage.
 * 
 * Usage:
 * - Add ?theme=clinical to URL to activate Clinical Clean design
 * - Theme persists in sessionStorage during navigation
 * - Default is 'pastel' (current design)
 */
export function useTheme() {
  const searchParams = useSearchParams();
  const [theme, setThemeState] = useState<Theme>('pastel');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check URL parameter first
    const urlTheme = searchParams.get('theme');
    
    if (urlTheme === 'clinical') {
      setThemeState('clinical');
      sessionStorage.setItem(THEME_STORAGE_KEY, 'clinical');
    } else if (urlTheme === 'pastel') {
      setThemeState('pastel');
      sessionStorage.setItem(THEME_STORAGE_KEY, 'pastel');
    } else {
      // Fall back to sessionStorage if no URL param
      const storedTheme = sessionStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme === 'clinical') {
        setThemeState('clinical');
      } else {
        setThemeState('pastel');
      }
    }
    
    setIsLoaded(true);
  }, [searchParams]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    sessionStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'pastel' ? 'clinical' : 'pastel';
    setTheme(newTheme);
  };

  return { 
    theme, 
    setTheme, 
    toggleTheme,
    isLoaded,
    isClinical: theme === 'clinical',
    isPastel: theme === 'pastel'
  };
}



