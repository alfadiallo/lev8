// Historical Class Card Component
// Expandable card showing SWOT data for a historical class

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SWOTElement } from '@/lib/types/analytics';

interface HistoricalClassCardProps {
  classYear: number;
  periodLabel: string;
  swotType: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  items: SWOTElement[];
  nComments: number;
  confidence: number;
}

const swotConfig = {
  strengths: {
    title: 'Strengths',
    icon: '💪',
    color: 'green'
  },
  weaknesses: {
    title: 'Weaknesses',
    icon: '⚠️',
    color: 'red'
  },
  opportunities: {
    title: 'Opportunities',
    icon: '🎯',
    color: 'blue'
  },
  threats: {
    title: 'Threats',
    icon: '🚧',
    color: 'orange'
  }
};

const prevalenceColors = {
  universal: 'bg-green-100 text-green-800',
  majority: 'bg-green-50 text-green-700',
  common: 'bg-yellow-50 text-yellow-700',
  occasional: 'bg-orange-50 text-orange-700',
  rare: 'bg-red-50 text-red-700'
};

const prevalenceLabels = {
  universal: 'Universal',
  majority: 'Majority',
  common: 'Common',
  occasional: 'Occasional',
  rare: 'Rare'
};

export default function HistoricalClassCard({
  classYear,
  periodLabel,
  swotType,
  items,
  nComments,
  confidence
}: HistoricalClassCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = swotConfig[swotType];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-neutral-800">
            Class of {classYear} | {periodLabel}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp size={20} className="text-neutral-600" />
          ) : (
            <ChevronDown size={20} className="text-neutral-600" />
          )}
        </div>
      </button>

      {/* Collapsed View - Just show element title */}
      {!isExpanded && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <span className="font-medium text-neutral-700">{config.title}</span>
            {items.length > 0 && (
              <span className="text-sm text-neutral-500">({items.length})</span>
            )}
          </div>
        </div>
      )}

      {/* Expanded View - Show full details */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Metadata */}
          <div className="text-sm text-neutral-600">
            Based on {nComments} evaluation{nComments !== 1 ? 's' : ''}
            {confidence && (
              <span className="ml-2">
                • {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* SWOT Element Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h5 className="font-semibold text-neutral-800">{config.title}</h5>
            <span className="text-sm text-neutral-500">({items.length})</span>
          </div>

          {/* SWOT Items */}
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-1">•</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-neutral-700 leading-relaxed">
                        {item.description}
                      </p>
                      {item.prevalence && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            prevalenceColors[item.prevalence]
                          }`}
                        >
                          {prevalenceLabels[item.prevalence]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm italic">No {config.title.toLowerCase()} identified</p>
          )}
        </div>
      )}
    </div>
  );
}


