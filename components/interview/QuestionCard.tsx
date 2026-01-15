'use client';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
};

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  followUp: string;
  isUsed: boolean;
  onToggle: () => void;
}

export default function QuestionCard({
  questionNumber,
  question,
  followUp,
  isUsed,
  onToggle
}: QuestionCardProps) {
  return (
    <div 
      className="rounded-lg p-4 transition-colors"
      style={{ 
        backgroundColor: COLORS.lightest + '40',
        borderLeft: `3px solid ${COLORS.dark}`
      }}
    >
      <div className="flex gap-3">
        {/* Radio Button */}
        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer"
          style={{
            borderColor: isUsed ? COLORS.dark : COLORS.medium,
            backgroundColor: isUsed ? COLORS.dark : 'transparent'
          }}
          title={isUsed ? 'Question used - click to unmark' : 'Click to mark question as used'}
        >
          {isUsed && (
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'white' }}
            />
          )}
        </button>
        
        {/* Question Number Badge */}
        <div
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: COLORS.dark }}
        >
          {questionNumber}
        </div>
        
        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <p 
            className="text-sm font-medium leading-relaxed mb-2"
            style={{ color: COLORS.darker }}
          >
            &ldquo;{question}&rdquo;
          </p>
          <div className="flex gap-2 flex-wrap">
            <span 
              className="text-xs font-semibold"
              style={{ color: COLORS.dark }}
            >
              Follow-up:
            </span>
            <span className="text-xs text-slate-500 leading-relaxed">
              {followUp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
