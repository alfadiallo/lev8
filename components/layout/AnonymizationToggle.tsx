'use client';

import { Shield, ShieldOff, Clock } from 'lucide-react';
import { useAnonymization } from '@/context/AnonymizationContext';

interface AnonymizationToggleProps {
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export default function AnonymizationToggle({ compact = false }: AnonymizationToggleProps) {
  const { isAnonymized, toggleAnonymization, timeRemaining } = useAnonymization();

  return (
    <button
      onClick={toggleAnonymization}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200
        ${isAnonymized 
          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
        }
      `}
      title={isAnonymized 
        ? `Privacy Mode ON - Names are hidden${timeRemaining ? ` (${timeRemaining} min remaining)` : ''}` 
        : 'Privacy Mode OFF - Click to enable for presentations'
      }
    >
      {isAnonymized ? (
        <Shield size={18} className="text-green-600" />
      ) : (
        <ShieldOff size={18} className="text-gray-500" />
      )}
      
      {!compact && (
        <span className="text-sm font-medium">
          {isAnonymized ? 'Privacy Mode' : 'Privacy Off'}
        </span>
      )}
      
      {isAnonymized && timeRemaining && (
        <span className="flex items-center gap-1 text-xs text-green-600 ml-1">
          <Clock size={12} />
          {timeRemaining}m
        </span>
      )}
    </button>
  );
}

// Smaller inline version for tight spaces
export function AnonymizationBadge() {
  const { isAnonymized, toggleAnonymization } = useAnonymization();

  return (
    <button
      onClick={toggleAnonymization}
      className={`
        p-1.5 rounded-lg transition-all duration-200
        ${isAnonymized 
          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }
      `}
      title={isAnonymized ? 'Privacy Mode ON' : 'Privacy Mode OFF'}
    >
      {isAnonymized ? <Shield size={16} /> : <ShieldOff size={16} />}
    </button>
  );
}






