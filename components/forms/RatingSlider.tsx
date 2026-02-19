'use client';

import React from 'react';

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  required?: boolean;
}

export default function RatingSlider({
  label,
  value,
  onChange,
  description,
  required = false,
}: RatingSliderProps) {
  // Color based on value (red → yellow → green) on 0-100 scale
  const _getColor = (val: number): string => {
    if (val < 35) return 'bg-red-500';
    if (val < 55) return 'bg-yellow-500';
    if (val < 80) return 'bg-green-500';
    return 'bg-emerald-600';
  };

  const getTextColor = (val: number): string => {
    if (val < 35) return 'text-red-600';
    if (val < 55) return 'text-yellow-600';
    if (val < 80) return 'text-green-600';
    return 'text-emerald-700';
  };

  return (
    <div className="space-y-2">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className={`text-lg font-bold ${getTextColor(value)}`}>
          {Math.round(value)}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-neutral-500">{description}</p>
      )}

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`,
          }}
        />
        
        {/* Value markers */}
        <div className="flex justify-between mt-1 px-1">
          {[0, 25, 50, 75, 100].map((marker) => (
            <span
              key={marker}
              className={`text-xs ${
                Math.abs(value - marker) < 5
                  ? 'font-bold text-neutral-900'
                  : 'text-neutral-400'
              }`}
            >
              {marker}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid currentColor;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}


