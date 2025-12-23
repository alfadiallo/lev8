// Emotional State Indicator Component
// Displays avatar's current emotional state (optional, toggleable)

'use client';

import { useState } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EmotionalStateIndicatorProps {
  emotionalState: {
    value: number; // 0-1
    currentThreshold: 'concerned' | 'upset' | 'angry' | 'hostile';
  };
  trajectory?: 'improving' | 'stable' | 'worsening';
  showByDefault?: boolean;
}

export default function EmotionalStateIndicator({
  emotionalState,
  trajectory = 'stable',
  showByDefault = false,
}: EmotionalStateIndicatorProps) {
  const [isVisible, setIsVisible] = useState(showByDefault);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 p-2 hover:bg-white/80 transition-colors"
        title="Show emotional state"
      >
        <Heart size={18} className="text-[#F4A5A5]" />
      </button>
    );
  }

  const { value, currentThreshold } = emotionalState;
  const percentage = Math.round(value * 100);

  // Color coding based on threshold
  const getColorForThreshold = (threshold: string) => {
    switch (threshold) {
      case 'hostile':
        return 'from-[#F4A5A5] to-[#E89595]';
      case 'angry':
        return 'from-[#FFD89B] to-[#FFB5A7]';
      case 'upset':
        return 'from-[#FFB5A7] to-[#FFD89B]';
      default:
        return 'from-[#D4F1F4] to-[#7EC8E3]';
    }
  };

  const getTrajectoryIcon = () => {
    switch (trajectory) {
      case 'improving':
        return <TrendingDown size={16} className="text-[#86C5A8]" />;
      case 'worsening':
        return <TrendingUp size={16} className="text-[#F4A5A5]" />;
      default:
        return <Minus size={16} className="text-neutral-400" />;
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-[#F4A5A5]" />
          <span className="font-semibold text-sm text-neutral-800">Emotional State</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-neutral-500 hover:text-neutral-700 text-xs"
        >
          Hide
        </button>
      </div>

      {/* Threshold Label */}
      <div className="mb-2">
        <span className={`text-sm font-medium capitalize px-3 py-1 rounded-lg bg-gradient-to-r ${getColorForThreshold(currentThreshold)} text-white`}>
          {currentThreshold}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/40 rounded-full h-3 mb-2">
        <div
          className={`bg-gradient-to-r ${getColorForThreshold(currentThreshold)} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage and Trajectory */}
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <span>{percentage}% intensity</span>
        <div className="flex items-center gap-1">
          {getTrajectoryIcon()}
          <span className="capitalize">{trajectory}</span>
        </div>
      </div>
    </div>
  );
}


