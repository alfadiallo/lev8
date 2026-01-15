'use client';

import { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  description: string;
}

export default function InfoTooltip({ description }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
    setIsVisible(true);
  };

  const handleClick = () => {
    if (!isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleClick}
        type="button"
      >
        <Info size={16} />
      </button>
      
      {isVisible && (
        <div
          className="fixed z-[9999] w-80 p-4 bg-slate-900 text-white rounded-lg text-sm leading-relaxed shadow-xl pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Arrow */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid rgb(15 23 42)'
            }}
          />
          <p className="m-0">{description}</p>
        </div>
      )}
    </div>
  );
}
