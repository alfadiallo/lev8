// Phase Indicator Component
// Displays current conversation phase and progress

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Circle } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  objective: string;
  completed?: boolean;
  current?: boolean;
}

interface PhaseIndicatorProps {
  phases: Phase[];
  currentPhaseId: string;
  objectivesCompleted?: string[];
  objectivesPending?: string[];
  onPhaseClick?: (phaseId: string) => void;
}

export default function PhaseIndicator({
  phases,
  currentPhaseId,
  objectivesCompleted = [],
  objectivesPending = [],
  onPhaseClick,
}: PhaseIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhaseId);
  const progress = currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / phases.length) * 100 : 0;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800">Conversation Progress</span>
          <span className="text-sm text-neutral-600">({Math.round(progress)}%)</span>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Progress Bar */}
      <div className="w-full bg-white/40 rounded-full h-2 mb-4">
        <div
          className="bg-[#0EA5E9] h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase List */}
      {isExpanded && (
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = phase.id === currentPhaseId;
            const isUpcoming = index > currentPhaseIndex;

            return (
              <div
                key={phase.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#E0F2FE] border-[#0EA5E9]/40'
                    : isCompleted
                    ? 'bg-white/30 border-white/30'
                    : 'bg-white/10 border-white/20 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Phase Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-[#86C5A8] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center">
                        <Circle size={14} className="text-white fill-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neutral-300 border-2 border-white" />
                    )}
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${
                        isCurrent ? 'text-neutral-800' : isCompleted ? 'text-neutral-700' : 'text-neutral-500'
                      }`}>
                        {phase.name}
                      </h4>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 bg-[#7EC8E3]/20 text-[#7EC8E3] rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${
                      isCurrent ? 'text-neutral-600' : 'text-neutral-500'
                    }`}>
                      {phase.objective}
                    </p>

                    {/* Objectives for current phase */}
                    {isCurrent && objectivesPending.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-neutral-600">Objectives:</p>
                        <div className="space-y-1">
                          {objectivesCompleted.map((obj, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-neutral-600">
                              <Check size={12} className="text-[#86C5A8]" />
                              <span className="line-through opacity-60">{obj}</span>
                            </div>
                          ))}
                          {objectivesPending.map((obj, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-neutral-700">
                              <Circle size={12} className="text-neutral-400" />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


