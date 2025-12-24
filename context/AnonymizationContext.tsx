'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface AnonymizationContextType {
  isAnonymized: boolean;
  toggleAnonymization: () => void;
  timeRemaining: number | null;
}

const AnonymizationContext = createContext<AnonymizationContextType | undefined>(undefined);

const ANONYMIZATION_DURATION_MINUTES = 60; // Default: 1 hour

interface AnonymizationProviderProps {
  children: ReactNode;
}

export function AnonymizationProvider({ children }: AnonymizationProviderProps) {
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('anonymization');
    if (stored) {
      const { enabled, expiresAt: storedExpires } = JSON.parse(stored);
      if (enabled && storedExpires && storedExpires > Date.now()) {
        setIsAnonymized(true);
        setExpiresAt(storedExpires);
      } else {
        localStorage.removeItem('anonymization');
      }
    }
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
      if (remaining === 0) {
        setIsAnonymized(false);
        setExpiresAt(null);
        localStorage.removeItem('anonymization');
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const toggleAnonymization = useCallback(() => {
    if (isAnonymized) {
      setIsAnonymized(false);
      setExpiresAt(null);
      setTimeRemaining(null);
      localStorage.removeItem('anonymization');
    } else {
      const expires = Date.now() + ANONYMIZATION_DURATION_MINUTES * 60000;
      setIsAnonymized(true);
      setExpiresAt(expires);
      setTimeRemaining(ANONYMIZATION_DURATION_MINUTES);
      localStorage.setItem('anonymization', JSON.stringify({ enabled: true, expiresAt: expires }));
    }
  }, [isAnonymized]);

  return (
    <AnonymizationContext.Provider value={{ isAnonymized, toggleAnonymization, timeRemaining }}>
      {children}
    </AnonymizationContext.Provider>
  );
}

export function useAnonymization() {
  const context = useContext(AnonymizationContext);
  if (context === undefined) {
    throw new Error('useAnonymization must be used within an AnonymizationProvider');
  }
  return context;
}

