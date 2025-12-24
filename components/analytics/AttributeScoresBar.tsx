// AI-Generated Attribute Scores Bar Chart Component
'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface AttributeScore {
  name: string;
  displayName: string;
  score: number;
  category: 'eq' | 'pq' | 'iq';
}

interface AttributeScoresBarProps {
  scores: {
    eq: {
      empathy: number;
      adaptability: number;
      stress_mgmt: number;
      curiosity: number;
      communication: number;
      avg: number;
    };
    pq: {
      work_ethic: number;
      integrity: number;
      teachability: number;
      documentation: number;
      leadership: number;
      avg: number;
    };
    iq: {
      knowledge: number;
      analytical: number;
      learning: number;
      flexibility: number;
      performance: number;
      avg: number;
    };
  };
  confidence: number;
  nComments: number;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  // EQ
  empathy: 'Empathy & Positive Interactions',
  adaptability: 'Adaptability & Self-Awareness',
  stress_mgmt: 'Stress Management & Resilience',
  curiosity: 'Curiosity & Growth Mindset',
  communication: 'Communication Skills',
  
  // PQ
  work_ethic: 'Work Ethic & Reliability',
  integrity: 'Integrity & Accountability',
  teachability: 'Teachability & Receptiveness',
  documentation: 'Documentation & Organization',
  leadership: 'Leadership & Initiative',
  
  // IQ
  knowledge: 'Medical Knowledge & Expertise',
  analytical: 'Analytical & Problem-Solving',
  learning: 'Learning & Knowledge Application',
  flexibility: 'Cognitive Flexibility',
  performance: 'Clinical Performance Under Pressure',
};

const CATEGORY_CONFIG = {
  eq: {
    label: 'Emotional Quotient (EQ)',
    barColor: '#22c55e', // green-500
    bgColor: '#dcfce7', // green-100
    textColor: '#15803d', // green-700
  },
  pq: {
    label: 'Professional Quotient (PQ)',
    barColor: '#3b82f6', // blue-500
    bgColor: '#dbeafe', // blue-100
    textColor: '#1d4ed8', // blue-700
  },
  iq: {
    label: 'Intellectual Quotient (IQ)',
    barColor: '#a855f7', // purple-500
    bgColor: '#f3e8ff', // purple-100
    textColor: '#7e22ce', // purple-700
  },
};

export function AttributeScoresBar({ scores, confidence, nComments }: AttributeScoresBarProps) {
  // Flatten scores into array format
  const attributes: AttributeScore[] = [];
  
  (['eq', 'pq', 'iq'] as const).forEach((category) => {
    Object.entries(scores[category]).forEach(([key, value]) => {
      if (key !== 'avg') {
        attributes.push({
          name: key,
          displayName: ATTRIBUTE_LABELS[key],
          score: value,
          category,
        });
      }
    });
  });

  // Group by category for rendering
  const groupedAttributes = {
    eq: attributes.filter(a => a.category === 'eq'),
    pq: attributes.filter(a => a.category === 'pq'),
    iq: attributes.filter(a => a.category === 'iq'),
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Generated Attribute Scores
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Based on {nComments} evaluation comment{nComments !== 1 ? 's' : ''} • 
            <span className={`ml-1 font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceLabel(confidence)} Confidence ({(confidence * 100).toFixed(0)}%)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>AI-interpreted from narrative comments</span>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="space-y-6">
        {(['eq', 'pq', 'iq'] as const).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const categoryAttrs = groupedAttributes[category];
          const categoryAvg = scores[category].avg;

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold" style={{ color: config.textColor }}>
                  {config.label}
                </h4>
                <span className="text-sm font-medium" style={{ color: config.textColor }}>
                  Avg: {categoryAvg.toFixed(1)}/5.0
                </span>
              </div>

              {/* Attribute Bars */}
              <div className="space-y-2">
                {categoryAttrs.map((attr) => {
                  const score = Number(attr.score) || 0;
                  const percentage = (score / 5.0) * 100;
                  const minWidth = 10;
                  const displayWidth = Math.max(percentage, minWidth);
                  
                  return (
                    <div key={attr.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Label */}
                      <div style={{ width: '220px', fontSize: '14px', color: '#374151', flexShrink: 0 }}>
                        {attr.displayName}
                      </div>

                      {/* Bar Track */}
                      <div style={{ 
                        flex: 1, 
                        height: '24px', 
                        backgroundColor: config.bgColor,
                        borderRadius: '6px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Filled Bar */}
                        <div style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${displayWidth}%`,
                          backgroundColor: config.barColor,
                          borderRadius: '6px',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>

                      {/* Score */}
                      <div style={{ 
                        width: '40px', 
                        textAlign: 'right', 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: config.textColor,
                        flexShrink: 0
                      }}>
                        {score.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Methodology Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Methodology:</strong> These scores represent AI interpretation of narrative evaluation comments 
            using the EQ+PQ+IQ framework. They differ from direct faculty ratings and are best used to supplement 
            structured assessments. Confidence score indicates the AI&apos;s certainty based on comment clarity and volume.
          </p>
        </div>
      </div>
    </div>
  );
}

