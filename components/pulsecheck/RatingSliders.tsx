'use client';

import { useState } from 'react';
import { Heart, Award, Brain, Info, ChevronDown, ChevronUp } from 'lucide-react';

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
const RATING_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: 'Unsatisfactory', description: 'Significant concerns' },
  2: { label: 'Needs Improvement', description: 'Inconsistent, requires support' },
  3: { label: 'Developing', description: 'Meets most expectations, areas for growth' },
  4: { label: 'Proficient', description: 'Meets expectations reliably' },
  5: { label: 'Exemplary', description: 'Consistently exceeds expectations' },
};

// Attribute definitions
const ATTRIBUTES = {
  EQ: {
    name: 'Emotional Quotient (EQ)',
    description: 'Mastering Interpersonal and Intrapersonal Skills',
    icon: Heart,
    color: '#10B981',
    attributes: [
      {
        id: 'eq_empathy_rapport',
        name: 'Empathy & Rapport',
        description: 'Demonstrates genuine empathy and builds meaningful rapport with patients, families, and colleagues.',
      },
      {
        id: 'eq_communication',
        name: 'Communication Effectiveness',
        description: 'Communicates clearly and adapts style appropriately to diverse patients, families, and team members.',
      },
      {
        id: 'eq_stress_management',
        name: 'Stress Management',
        description: 'Maintains composure, focus, and clinical effectiveness during high-acuity or high-volume situations.',
      },
      {
        id: 'eq_self_awareness',
        name: 'Self-Awareness',
        description: 'Recognizes personal strengths, limitations, and emotional triggers; seeks feedback proactively.',
      },
      {
        id: 'eq_adaptability',
        name: 'Adaptability & Growth Mindset',
        description: 'Responds constructively to change, setbacks, or criticism; demonstrates curiosity and commitment to personal development.',
      },
    ],
  },
  PQ: {
    name: 'Professionalism Quotient (PQ)',
    description: 'Upholding Professional Decorum and Leadership',
    icon: Award,
    color: '#6366F1',
    attributes: [
      {
        id: 'pq_reliability',
        name: 'Reliability & Work Ethic',
        description: 'Consistently dependable; arrives prepared, completes responsibilities, and follows through on commitments.',
      },
      {
        id: 'pq_integrity',
        name: 'Integrity & Accountability',
        description: 'Takes ownership of decisions and outcomes; acknowledges errors and addresses them transparently.',
      },
      {
        id: 'pq_teachability',
        name: 'Teachability & Receptiveness',
        description: 'Accepts constructive feedback gracefully and implements changes meaningfully.',
      },
      {
        id: 'pq_documentation',
        name: 'Documentation Quality',
        description: 'Produces accurate, thorough, and timely clinical documentation.',
      },
      {
        id: 'pq_leadership',
        name: 'Leadership & Collaboration',
        description: 'Fosters positive team dynamics, models leadership and collaborates well with colleagues, staff and residents.',
      },
    ],
  },
  IQ: {
    name: 'Intellectual Quotient (IQ)',
    description: 'Excelling in Clinical Acumen and Critical Thinking',
    icon: Brain,
    color: '#F59E0B',
    attributes: [
      {
        id: 'iq_clinical_management',
        name: 'Clinical Management',
        description: 'Applies systematic, logical diagnostic thinking towards workups and utilization.',
      },
      {
        id: 'iq_evidence_based',
        name: 'Evidence-Based Practice',
        description: 'Integrates current literature and guidelines into clinical decision-making.',
      },
      {
        id: 'iq_procedural',
        name: 'Procedural & Technical Competence',
        description: 'Performs clinical skills, procedures and ultrasounds proficiently.',
      },
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

function getScoreColor(score: number | null): string {
  if (score === null) return '#E2E8F0';
  if (score >= 5) return '#166534';
  if (score >= 4) return '#15803D';
  if (score >= 3) return '#CA8A04';
  if (score >= 2) return '#EA580C';
  return '#DC2626';
}

function getScoreBackground(score: number | null): string {
  if (score === null) return '#F1F5F9';
  if (score >= 5) return '#DCFCE7';
  if (score >= 4) return '#D1FAE5';
  if (score >= 3) return '#FEF9C3';
  if (score >= 2) return '#FFEDD5';
  return '#FEE2E2';
}

export default function RatingSliders({ values, onChange, readOnly = false }: RatingSlidersProps) {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    EQ: true,
    PQ: true,
    IQ: true,
  });

  const handleRatingChange = (attributeId: string, value: number) => {
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

  return (
    <div className="space-y-6">
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
            {/* Domain Header */}
            <button
              onClick={() => toggleDomain(domainKey)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${domain.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: domain.color }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">{domain.name}</h3>
                  <p className="text-sm text-slate-500">{domain.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {domainAvg !== null && (
                  <div 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: getScoreBackground(domainAvg),
                      color: getScoreColor(domainAvg),
                    }}
                  >
                    Avg: {domainAvg}
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Attributes */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {domain.attributes.map((attr) => {
                  const currentValue = values[attr.id as keyof RatingValues];
                  
                  return (
                    <div key={attr.id} className="space-y-2">
                      {/* Attribute Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{attr.name}</span>
                          <div className="group relative">
                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              {attr.description}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        {currentValue !== null && (
                          <div 
                            className="px-2 py-0.5 rounded text-sm font-medium"
                            style={{ 
                              backgroundColor: getScoreBackground(currentValue),
                              color: getScoreColor(currentValue),
                            }}
                          >
                            {currentValue} - {RATING_LABELS[currentValue]?.label}
                          </div>
                        )}
                      </div>

                      {/* Rating Buttons */}
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const isSelected = currentValue === rating;
                          return (
                            <button
                              key={rating}
                              onClick={() => !readOnly && handleRatingChange(attr.id, rating)}
                              disabled={readOnly}
                              className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'shadow-md transform scale-105 ring-2 ring-offset-1'
                                  : 'hover:shadow-sm hover:scale-[1.02]'
                              } ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                              style={{
                                backgroundColor: getScoreBackground(rating),
                                borderColor: isSelected ? getScoreColor(rating) : 'transparent',
                                color: getScoreColor(rating),
                                ...(isSelected ? { ringColor: getScoreColor(rating) } : {}),
                              }}
                              title={`${rating} - ${RATING_LABELS[rating].label}: ${RATING_LABELS[rating].description}`}
                            >
                              <div className="text-center">
                                <div className="text-lg font-bold">{rating}</div>
                                <div className="text-xs truncate hidden sm:block">
                                  {RATING_LABELS[rating].label}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
