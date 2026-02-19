'use client';

import { useState } from 'react';
import { Heart, Award, Brain, Info, ChevronDown, ChevronUp, X } from 'lucide-react';

// Purple color palette for Pulse Check
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  mediumLight: '#C4B5FD',
  medium: '#A78BFA',
  mediumDark: '#8B5CF6',
  dark: '#7C3AED',
  darker: '#6D28D9',
  veryDark: '#5B21B6',
  darkest: '#4C1D95',
};

// Rating scale labels
const RATING_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  0:  { label: 'Unsatisfactory', color: '#DC2626', bg: '#FEE2E2' },
  25: { label: 'Needs Improvement', color: '#EA580C', bg: '#FFEDD5' },
  50: { label: 'Developing', color: '#CA8A04', bg: '#FEF9C3' },
  75: { label: 'Proficient', color: '#15803D', bg: '#D1FAE5' },
  100: { label: 'Exemplary', color: '#166534', bg: '#DCFCE7' },
};

const LABEL_KEYS = [0, 25, 50, 75, 100];
function closestLabel(value: number) {
  const key = LABEL_KEYS.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
  return RATING_LABELS[key] || { label: '', color: '#64748B', bg: '#F1F5F9' };
}

// Attribute definitions
const ATTRIBUTES = {
  EQ: {
    name: 'Emotional Quotient (EQ)',
    description: 'Mastering Interpersonal and Intrapersonal Skills',
    icon: Heart,
    color: '#10B981',
    attributes: [
      { id: 'eq_empathy_rapport', name: 'Empathy & Rapport', description: 'Demonstrates genuine empathy and builds meaningful rapport with patients, families, and colleagues.' },
      { id: 'eq_communication', name: 'Communication Effectiveness', description: 'Communicates clearly and adapts style appropriately to diverse patients, families, and team members.' },
      { id: 'eq_stress_management', name: 'Stress Management', description: 'Maintains composure, focus, and clinical effectiveness during high-acuity or high-volume situations.' },
      { id: 'eq_self_awareness', name: 'Self-Awareness', description: 'Recognizes personal strengths, limitations, and emotional triggers; seeks feedback proactively.' },
      { id: 'eq_adaptability', name: 'Adaptability & Growth Mindset', description: 'Responds constructively to change, setbacks, or criticism; demonstrates curiosity and commitment to personal development.' },
    ],
  },
  PQ: {
    name: 'Professionalism Quotient (PQ)',
    description: 'Upholding Professional Decorum and Leadership',
    icon: Award,
    color: '#6366F1',
    attributes: [
      { id: 'pq_reliability', name: 'Reliability & Work Ethic', description: 'Consistently dependable; arrives prepared, completes responsibilities, and follows through on commitments.' },
      { id: 'pq_integrity', name: 'Integrity & Accountability', description: 'Takes ownership of decisions and outcomes; acknowledges errors and addresses them transparently.' },
      { id: 'pq_teachability', name: 'Teachability & Receptiveness', description: 'Accepts constructive feedback gracefully and implements changes meaningfully.' },
      { id: 'pq_documentation', name: 'Documentation Quality', description: 'Produces accurate, thorough, and timely clinical documentation.' },
      { id: 'pq_leadership', name: 'Leadership & Collaboration', description: 'Fosters positive team dynamics, models leadership and collaborates well with colleagues, staff and residents.' },
    ],
  },
  IQ: {
    name: 'Intellectual Quotient (IQ)',
    description: 'Excelling in Clinical Acumen and Critical Thinking',
    icon: Brain,
    color: '#F59E0B',
    attributes: [
      { id: 'iq_clinical_management', name: 'Clinical Management', description: 'Applies systematic, logical diagnostic thinking towards workups and utilization.' },
      { id: 'iq_evidence_based', name: 'Evidence-Based Practice', description: 'Integrates current literature and guidelines into clinical decision-making.' },
      { id: 'iq_procedural', name: 'Procedural & Technical Competence', description: 'Performs clinical skills, procedures and ultrasounds proficiently.' },
    ],
  },
};

export interface RatingValues {
  eq_empathy_rapport: number | null;
  eq_communication: number | null;
  eq_stress_management: number | null;
  eq_self_awareness: number | null;
  eq_adaptability: number | null;
  pq_reliability: number | null;
  pq_integrity: number | null;
  pq_teachability: number | null;
  pq_documentation: number | null;
  pq_leadership: number | null;
  iq_clinical_management: number | null;
  iq_evidence_based: number | null;
  iq_procedural: number | null;
}

interface RatingSlidersProps {
  values: RatingValues;
  onChange: (values: RatingValues) => void;
  readOnly?: boolean;
}

export default function RatingSliders({ values, onChange, readOnly = false }: RatingSlidersProps) {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    EQ: true,
    PQ: true,
    IQ: true,
  });

  const handleRatingChange = (attributeId: string, value: number | null) => {
    onChange({
      ...values,
      [attributeId]: value,
    });
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  const calculateDomainAverage = (domain: 'EQ' | 'PQ' | 'IQ'): number | null => {
    const attrs = ATTRIBUTES[domain].attributes;
    const scores = attrs.map(attr => values[attr.id as keyof RatingValues]).filter(v => v !== null) as number[];
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  const getSliderBackground = (value: number | null) => {
    if (value === null) return '#E2E8F0';
    const percentage = value; // 0-100 maps directly to percentage
    // Find closest label key for color
    const labelKeys = [0, 25, 50, 75, 100];
    const closest = labelKeys.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
    const colorInfo = RATING_LABELS[closest];
    return `linear-gradient(to right, ${colorInfo?.color || '#64748B'} ${percentage}%, #E2E8F0 ${percentage}%)`;
  };

  return (
    <div className="space-y-4">
      {(Object.keys(ATTRIBUTES) as Array<'EQ' | 'PQ' | 'IQ'>).map((domainKey) => {
        const domain = ATTRIBUTES[domainKey];
        const Icon = domain.icon;
        const isExpanded = expandedDomains[domainKey];
        const domainAvg = calculateDomainAverage(domainKey);

        return (
          <div
            key={domainKey}
            className="bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: COLORS.light }}
          >
            {/* Domain Header - Compact */}
            <button
              onClick={() => toggleDomain(domainKey)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${domain.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: domain.color }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 text-sm">{domain.name}</h3>
                  <p className="text-xs text-slate-500">{domain.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {domainAvg !== null && (
                  <div 
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: closestLabel(domainAvg).bg,
                      color: closestLabel(domainAvg).color,
                    }}
                  >
                    {Math.round(domainAvg)}
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Attributes - Compact List */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {domain.attributes.map((attr) => {
                  const currentValue = values[attr.id as keyof RatingValues];
                  
                  return (
                    <div key={attr.id} className="space-y-1">
                      {/* Attribute Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700 text-sm">{attr.name}</span>
                          <div className="group relative">
                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              {attr.description}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentValue !== null && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: closestLabel(currentValue).bg,
                                color: closestLabel(currentValue).color,
                              }}
                            >
                              {currentValue} - {closestLabel(currentValue).label}
                            </span>
                          )}
                          {!readOnly && currentValue !== null && (
                            <button
                              onClick={() => handleRatingChange(attr.id, null)}
                              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              title="Clear rating"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Slider Row */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-4 text-center">0</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={currentValue || 50}
                          onChange={(e) => !readOnly && handleRatingChange(attr.id, parseInt(e.target.value))}
                          disabled={readOnly}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            background: currentValue !== null ? getSliderBackground(currentValue) : '#E2E8F0',
                          }}
                        />
                        <span className="text-xs text-slate-400 w-6 text-center">100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Custom slider styles */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${COLORS.dark};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${COLORS.dark};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type='range']:disabled::-webkit-slider-thumb {
          background: #94A3B8;
          cursor: not-allowed;
        }
        input[type='range']:disabled::-moz-range-thumb {
          background: #94A3B8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
