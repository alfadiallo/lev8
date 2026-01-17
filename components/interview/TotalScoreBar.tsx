'use client';

import { TrendingUp } from 'lucide-react';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  mediumLight: '#95D5B2',
  medium: '#74C69D',
  mediumDark: '#52B788',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
  darkest: '#081C15',
};

interface TotalScoreBarProps {
  eqScore: number;
  pqScore: number;
  iqScore: number;
}

export default function TotalScoreBar({ eqScore, pqScore, iqScore }: TotalScoreBarProps) {
  const totalScore = eqScore + pqScore + iqScore;

  return (
    <div 
      className="rounded-xl p-4 border"
      style={{ 
        background: `linear-gradient(to right, ${COLORS.lightest}, white)`,
        borderColor: COLORS.light,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.dark }} />
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Score</span>
            <p className="text-xs text-slate-500 dark:text-slate-500">EQ + PQ + IQ</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold" style={{ color: COLORS.darker }}>{totalScore}</span>
          <span className="text-lg text-slate-400 dark:text-slate-500"> / 300</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        className="mt-3 h-3 rounded-full"
        style={{ backgroundColor: COLORS.lightest }}
      >
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${(totalScore / 300) * 100}%`,
            background: `linear-gradient(to right, ${COLORS.mediumLight}, ${COLORS.medium}, ${COLORS.dark})`,
          }}
        />
      </div>
    </div>
  );
}
