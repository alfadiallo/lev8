// Branching Hint Component
// Displays hints when learner is stuck or needs guidance

'use client';

import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

interface BranchingHintProps {
  hints: string[];
  phaseName?: string;
  onDismiss?: () => void;
}

export default function BranchingHint({
  hints,
  phaseName,
  onDismiss,
}: BranchingHintProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || hints.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-[#E0F2FE] backdrop-blur-sm rounded-xl border border-[#0EA5E9]/30 p-4">
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="text-[#0EA5E9] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-neutral-800">
              {phaseName ? `${phaseName} - Guidance` : 'Conversation Guidance'}
            </h4>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {hints.map((hint, index) => (
              <li key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                <span className="text-[#0EA5E9] mt-1">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


