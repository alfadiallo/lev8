'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Heart, Award, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import DomainGuidePanel from './DomainGuidePanel';
import { getDomain } from '@/lib/interview/guide-data';

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

interface RatingSlidersProps {
  eqScore: number;
  pqScore: number;
  iqScore: number;
  onEqChange: (value: number) => void;
  onPqChange: (value: number) => void;
  onIqChange: (value: number) => void;
  disabled?: boolean;
  usedQuestions?: Record<string, boolean>;
  onQuestionToggle?: (questionId: string) => void;
  showGuide?: boolean;
}

interface SliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  icon: ReactNode;
  disabled?: boolean;
  domainId?: 'EQ' | 'PQ' | 'IQ';
  usedQuestions?: Record<string, boolean>;
  onQuestionToggle?: (questionId: string) => void;
  showGuide?: boolean;
}

function getColorByValue(value: number) {
  if (value < 33) return COLORS.mediumLight;
  if (value < 66) return COLORS.medium;
  return COLORS.dark;
}

function Slider({ 
  label, 
  description, 
  value, 
  onChange, 
  icon, 
  disabled,
  domainId,
  usedQuestions = {},
  onQuestionToggle,
  showGuide = true
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const fillColor = getColorByValue(localValue);
  const domain = domainId ? getDomain(domainId) : null;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    // Snap to nearest 5
    const snappedValue = Math.round(newValue / 5) * 5;
    setLocalValue(snappedValue);
  };

  const handleMouseUp = () => {
    onChange(localValue);
  };

  const handleKeyUp = () => {
    onChange(localValue);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-xl p-6 border transition-all"
      style={{ borderColor: COLORS.light }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: COLORS.lightest }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div 
          className="text-3xl font-bold"
          style={{ color: COLORS.dark }}
        >
          {Math.round(localValue)}
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative h-10 flex items-center">
        {/* Track Background */}
        <div 
          className="absolute w-full h-4 rounded-full" 
          style={{ backgroundColor: COLORS.lightest }} 
        />
        
        {/* Tick marks at every 5 points - showing major ticks at 0, 25, 50, 75, 100 */}
        <div className="absolute w-full flex justify-between px-0.5 pointer-events-none">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div 
              key={tick} 
              className="w-0.5 h-2 rounded-full"
              style={{ 
                backgroundColor: localValue >= tick ? fillColor : COLORS.light,
                opacity: 0.6,
              }} 
            />
          ))}
        </div>
        
        {/* Filled Track - fully rounded pill shape */}
        {localValue > 0 && (
          <div 
            className="absolute h-4 rounded-full transition-all duration-150"
            style={{ 
              width: `${Math.max(localValue, 4)}%`,
              backgroundColor: fillColor,
            }} 
          />
        )}
        
        {/* Circular Thumb - prominent white circle with colored border */}
        <div 
          className="absolute w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-150 pointer-events-none"
          style={{ 
            left: `${localValue}%`,
            transform: 'translateX(-50%)',
            border: `3px solid ${fillColor}`,
          }} 
        />

        {/* Input - step of 5 */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          className="absolute w-full h-10 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-transparent
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-7
            [&::-moz-range-thumb]:h-7
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-transparent
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      {/* Interview Questions Guide */}
      {showGuide && domain && onQuestionToggle && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.lightest }}>
          <button
            type="button"
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: COLORS.darker }}
          >
            {isGuideExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Interview Questions ({domain.subAttributes.reduce((sum, attr) => sum + attr.questions.length, 0)})
          </button>
          
          {isGuideExpanded && (
            <DomainGuidePanel
              domain={domain}
              usedQuestions={usedQuestions}
              onQuestionToggle={onQuestionToggle}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function RatingSliders({
  eqScore,
  pqScore,
  iqScore,
  onEqChange,
  onPqChange,
  onIqChange,
  disabled = false,
  usedQuestions = {},
  onQuestionToggle,
  showGuide = true,
}: RatingSlidersProps) {
  return (
    <div className="space-y-4">
      <Slider
        label="Emotional Quotient (EQ)"
        description="Empathy, adaptability, communication"
        value={eqScore}
        onChange={onEqChange}
        icon={<Heart className="w-5 h-5" style={{ color: COLORS.dark }} />}
        disabled={disabled}
        domainId="EQ"
        usedQuestions={usedQuestions}
        onQuestionToggle={onQuestionToggle}
        showGuide={showGuide}
      />

      <Slider
        label="Professional Quotient (PQ)"
        description="Work ethic, integrity, leadership"
        value={pqScore}
        onChange={onPqChange}
        icon={<Award className="w-5 h-5" style={{ color: COLORS.dark }} />}
        disabled={disabled}
        domainId="PQ"
        usedQuestions={usedQuestions}
        onQuestionToggle={onQuestionToggle}
        showGuide={showGuide}
      />

      <Slider
        label="Intellectual Quotient (IQ)"
        description="Knowledge, problem-solving, reasoning"
        value={iqScore}
        onChange={onIqChange}
        icon={<Brain className="w-5 h-5" style={{ color: COLORS.dark }} />}
        disabled={disabled}
        domainId="IQ"
        usedQuestions={usedQuestions}
        onQuestionToggle={onQuestionToggle}
        showGuide={showGuide}
      />
    </div>
  );
}
