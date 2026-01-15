'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import CuesTooltip from './CuesTooltip';
import QuestionCard from './QuestionCard';
import { SubAttribute, getQuestionId } from '@/lib/interview/guide-data';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
};

interface SubAttributeSectionProps {
  domainId: string;
  subAttribute: SubAttribute;
  isExpanded: boolean;
  onToggle: () => void;
  usedQuestions: Record<string, boolean>;
  onQuestionToggle: (questionId: string) => void;
}

export default function SubAttributeSection({
  domainId,
  subAttribute,
  isExpanded,
  onToggle,
  usedQuestions,
  onQuestionToggle
}: SubAttributeSectionProps) {
  return (
    <div 
      className="border rounded-lg overflow-hidden transition-colors"
      style={{ borderColor: COLORS.light }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50"
        style={{ backgroundColor: isExpanded ? COLORS.lightest + '60' : 'transparent' }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-slate-400 flex-shrink-0">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
          <h4 
            className="text-sm font-medium truncate"
            style={{ color: COLORS.darker }}
          >
            {subAttribute.name}
          </h4>
          <div onClick={(e) => e.stopPropagation()}>
            <InfoTooltip description={subAttribute.description} />
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <CuesTooltip cues={subAttribute.cues} />
        </div>
      </div>

      {/* Questions */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 bg-white">
          {subAttribute.questions.map((q, idx) => {
            const questionId = getQuestionId(domainId, subAttribute.id, idx);
            return (
              <QuestionCard
                key={questionId}
                questionNumber={idx + 1}
                question={q.question}
                followUp={q.followUp}
                isUsed={usedQuestions[questionId] || false}
                onToggle={() => onQuestionToggle(questionId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
