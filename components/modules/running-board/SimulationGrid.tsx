// SimulationGrid - Main grid layout for the simulation
// Displays patient columns and phase rows matching the Excel layout

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { 
  ClinicalCase, 
  CheckboxState, 
  PhaseId,
  PHASE_LABELS,
  PHASE_TIME_RANGES,
  ACUITY_COLORS,
} from '@/lib/types/running-board';
import { FACILITATOR_SCRIPTS } from '@/lib/running-board/presets';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface SimulationGridProps {
  cases: ClinicalCase[];
  currentPhase: PhaseId;
  elapsedTime: number;
  checkboxState: CheckboxState;
  onCheckboxToggle: (caseId: string, itemId: string, phaseId: PhaseId, isCritical: boolean) => void;
  darkMode: boolean;
}

// Get color class for patient column based on acuity
function getColumnColor(acuity: number, darkMode: boolean, index: number): string {
  // Visual override for Patient B (index 1) to be Orange if it's currently Red (ESI 1)
  if (index === 1 && acuity === 1) {
    return darkMode ? 'bg-orange-950' : 'bg-orange-50';
  }

  const colors: Record<number, { light: string; dark: string }> = {
    1: { light: 'bg-red-50', dark: 'bg-red-950' },
    2: { light: 'bg-orange-50', dark: 'bg-orange-950' },
    3: { light: 'bg-yellow-50', dark: 'bg-yellow-950' },
    4: { light: 'bg-green-50', dark: 'bg-green-950' },
    5: { light: 'bg-blue-50', dark: 'bg-blue-950' },
  };
  return darkMode ? colors[acuity]?.dark || 'bg-neutral-800' : colors[acuity]?.light || 'bg-neutral-50';
}

export default function SimulationGrid({
  cases,
  currentPhase,
  elapsedTime,
  checkboxState,
  onCheckboxToggle,
  darkMode,
}: SimulationGridProps) {
  const allPhases: PhaseId[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const [expandedTriggers, setExpandedTriggers] = React.useState<Record<string, boolean>>({});

  // Refs for scroll sync
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const toggleTriggers = (key: string) => {
    setExpandedTriggers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync header scroll with body scroll
  const handleBodyScroll = useCallback(() => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    if (headerRef.current && bodyRef.current) {
      headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isScrolling.current = false; });
  }, []);

  useEffect(() => {
    const bodyEl = bodyRef.current;
    if (bodyEl) {
      bodyEl.addEventListener('scroll', handleBodyScroll, { passive: true });
      return () => bodyEl.removeEventListener('scroll', handleBodyScroll);
    }
  }, [handleBodyScroll]);

  // Calculate grid template columns based on number of cases
  const gridCols = `224px repeat(${cases.length}, 280px)`;
  const totalWidth = 224 + (cases.length * 280);

  return (
    <div className="simulation-grid-wrapper h-full flex flex-col overflow-hidden">
      {/* STICKY PATIENT HEADER - positioned at top, scrolls horizontally with body */}
      <div 
        ref={headerRef}
        className={`flex-shrink-0 overflow-x-auto overflow-y-hidden scrollbar-hide z-40 ${
          darkMode ? 'shadow-lg shadow-black/30' : 'shadow-md shadow-neutral-200/80'
        }`}
      >
        <div
          style={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols,
            minWidth: totalWidth,
          }}
        >
          {/* Facilitator Column Header - STICKY LEFT */}
          <div 
            className={`sticky left-0 z-50 p-3 border-r-2 border-b-2 flex flex-col justify-end ${
              darkMode ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-100 border-neutral-300'
            }`}
          >
            <div className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
              Time
            </div>
            <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Facilitator Actions & Scripts
            </div>
          </div>

        {/* Patient Column Headers */}
        {cases.map((caseItem, idx) => {
          const acuity = ACUITY_COLORS[caseItem.acuity_level];
            return (
              <div 
                key={caseItem.id} 
                className={`p-3 border-r border-b-2 ${
                  darkMode ? 'border-neutral-700 border-b-neutral-600' : 'border-neutral-200 border-b-neutral-300'
                } ${getColumnColor(caseItem.acuity_level, darkMode, idx)}`}
              >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Patient {String.fromCharCode(65 + idx)} - Bed {idx + 1}
                  </span>
                  <h3 className={`font-bold text-base ${darkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {caseItem.title}
                  </h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${acuity.bg} ${acuity.text}`}>
                  ESI-{caseItem.acuity_level}
                </span>
              </div>
              
              <div className={`text-sm mb-2 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                <strong>{caseItem.patient_profile.demographics}</strong>
                <span className="mx-1">•</span>
                {caseItem.patient_profile.chief_complaint}
              </div>
              
              <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <div>VS: BP {caseItem.patient_profile.initial_vitals.bp}, HR {caseItem.patient_profile.initial_vitals.hr}, RR {caseItem.patient_profile.initial_vitals.rr}</div>
                <div>O2 {caseItem.patient_profile.initial_vitals.o2}, Temp {caseItem.patient_profile.initial_vitals.temp}</div>
                <div className="mt-1 font-medium">Target: {caseItem.patient_profile.target_disposition}</div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* SCROLLABLE BODY - Phase rows */}
      <div 
        ref={bodyRef}
        className="flex-1 overflow-auto overscroll-contain touch-manipulation simulation-view"
      >
        <div style={{ minWidth: totalWidth }}>
          {allPhases.map((phaseId) => {
            const isCurrentPhase = phaseId === currentPhase;
            const facilitatorScript = FACILITATOR_SCRIPTS.find(s => s.phase_id === phaseId);
            
            return (
              <div 
                key={phaseId}
                className={`border-b ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: gridCols,
                }}
              >
                {/* Facilitator Column - STICKY LEFT */}
                <div 
                  className={`sticky left-0 z-30 p-3 border-r-2 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-neutral-800 border-neutral-600'
                      : 'bg-neutral-50 border-neutral-300'
                  } ${isCurrentPhase ? 'border-l-4 border-l-sky-500 pl-2' : ''}`}
                >
                  <div className={`font-bold text-sm mb-1 ${darkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {PHASE_TIME_RANGES[phaseId]}
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    darkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {PHASE_LABELS[phaseId]}
                  </div>
                  
                  {facilitatorScript && (
                    <div className="space-y-2 text-xs">
                      {facilitatorScript.global_prompts.map((prompt, idx) => (
                        <p 
                          key={idx} 
                          className={`${
                            prompt.startsWith('"') || prompt.includes(':') 
                              ? 'font-semibold' 
                              : 'italic'
                          } ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}
                        >
                          {prompt}
                        </p>
                      ))}
                      
                      {facilitatorScript.delegation_cues && (
                        <div className={`mt-2 p-2 rounded ${
                          darkMode ? 'bg-amber-900/30' : 'bg-amber-50'
                        }`}>
                          {facilitatorScript.delegation_cues.map((cue, idx) => (
                            <p key={idx} className={`text-xs italic ${
                              darkMode ? 'text-amber-300' : 'text-amber-700'
                            }`}>
                              {cue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Patient Columns */}
                {cases.map((caseItem, colIdx) => {
                  const phaseData = caseItem.timeline.find(t => t.phase_id === phaseId);
                  
                  return (
                    <div 
                      key={`${caseItem.id}-${phaseId}`}
                      className={`p-3 border-r ${
                        darkMode ? 'border-neutral-700' : 'border-neutral-200'
                      } ${getColumnColor(caseItem.acuity_level, darkMode, colIdx)}`}
                    >
                      {phaseData ? (
                        <div className="space-y-3">
                          {/* Vitals Update */}
                          {phaseData.vitals_update && (
                            <div className={`text-xs p-2 rounded ${
                              darkMode ? 'bg-neutral-700/50' : 'bg-white/80'
                            }`}>
                              <span className="font-semibold">Vitals: </span>
                              BP {phaseData.vitals_update.bp}, HR {phaseData.vitals_update.hr}, 
                              RR {phaseData.vitals_update.rr}, O2 {phaseData.vitals_update.o2}
                            </div>
                          )}

                          {/* Script Prompt */}
                          <p className={`text-sm ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                            {phaseData.script_prompt}
                          </p>

                          {/* Conditional Triggers */}
                          {phaseData.conditional_triggers && phaseData.conditional_triggers.length > 0 && (
                            <div>
                              <button
                                onClick={() => toggleTriggers(`${caseItem.id}-${phaseId}`)}
                                className={`flex items-center gap-1 text-xs ${
                                  darkMode ? 'text-amber-400' : 'text-amber-600'
                                }`}
                              >
                                <AlertTriangle size={12} />
                                {expandedTriggers[`${caseItem.id}-${phaseId}`] ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronRight size={12} />
                                )}
                                <span>Triggers ({phaseData.conditional_triggers.length})</span>
                              </button>
                              
                              {expandedTriggers[`${caseItem.id}-${phaseId}`] && (
                                <div className={`mt-1 p-2 rounded text-xs space-y-1 ${
                                  darkMode ? 'bg-amber-900/30' : 'bg-amber-50'
                                }`}>
                                  {phaseData.conditional_triggers.map((trigger, idx) => (
                                    <div key={idx}>
                                      <span className={`italic ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                        {trigger.condition}:
                                      </span>
                                      <span className={`ml-1 font-medium ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                                        {trigger.script}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Checklist */}
                          {phaseData.checklist.length > 0 && (
                            <div className="space-y-1">
                              {phaseData.checklist.map((item) => {
                                const key = `${caseItem.id}_${item.id}`;
                                const state = checkboxState[key];
                                const isChecked = state?.checked || false;

                                return (
                                  <label
                                    key={item.id}
                                    className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg transition-colors touch-manipulation active:scale-[0.99] ${
                                      item.is_critical
                                        ? isChecked
                                          ? darkMode ? 'bg-green-900/30' : 'bg-green-100'
                                          : darkMode ? 'bg-red-900/20' : 'bg-red-50'
                                        : isChecked
                                        ? darkMode ? 'bg-neutral-700/50' : 'bg-neutral-100'
                                        : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => onCheckboxToggle(caseItem.id, item.id, phaseId, item.is_critical)}
                                      className={`mt-0.5 w-7 h-7 rounded cursor-pointer simulation-checkbox touch-manipulation ${
                                        isChecked ? 'checkbox-checked' : ''
                                      } ${
                                        item.is_critical
                                          ? 'accent-red-500'
                                          : 'accent-sky-500'
                                      }`}
                                      style={{ minWidth: '28px', minHeight: '28px' }}
                                    />
                                    <span className={`text-sm ${
                                      isChecked 
                                        ? 'line-through opacity-60' 
                                        : item.is_critical 
                                          ? darkMode ? 'text-red-300 font-medium' : 'text-red-700 font-medium'
                                          : ''
                                    }`}>
                                      {item.label}
                                      {item.is_critical && !isChecked && (
                                        <span className="ml-1 text-xs text-red-500">●</span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`text-sm italic ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
