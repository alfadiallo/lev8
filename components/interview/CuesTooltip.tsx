'use client';

import { useState, useRef } from 'react';
import { Eye } from 'lucide-react';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
};

interface CuesTooltipProps {
  cues: string[];
}

export default function CuesTooltip({ cues }: CuesTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.right
      });
    }
    setIsVisible(true);
  };

  const handleClick = () => {
    if (!isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.right
      });
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
        style={{ 
          backgroundColor: COLORS.lightest, 
          color: COLORS.darker,
          border: `1px solid ${COLORS.light}`
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleClick}
        type="button"
      >
        <Eye size={14} />
        <span>Cues</span>
      </button>
      
      {isVisible && (
        <div
          className="fixed z-[9999] w-96 p-4 bg-slate-900 text-white rounded-xl text-sm shadow-xl pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translateX(-100%)'
          }}
        >
          {/* Arrow */}
          <div 
            className="absolute -top-2 right-5 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid rgb(15 23 42)'
            }}
          />
          <ul className="m-0 p-0 list-none space-y-2.5">
            {cues.map((cue, idx) => (
              <li key={idx} className="relative pl-4 leading-relaxed">
                <span 
                  className="absolute left-0 font-bold"
                  style={{ color: COLORS.medium }}
                >
                  •
                </span>
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
