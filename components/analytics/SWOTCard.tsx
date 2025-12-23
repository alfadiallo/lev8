// SWOT Card Component
// Individual card for Strengths, Weaknesses, Opportunities, or Threats
// Supports expandable citations accordion

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { SWOTElement } from '@/lib/types/analytics';
import SWOTEvidenceModal from './SWOTEvidenceModal';

interface SWOTCardProps {
  title: string;
  items: SWOTElement[];
  color: 'green' | 'red' | 'blue' | 'orange';
  icon: string;
  classYear?: number;
  periodLabel?: string;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    accent: 'bg-green-100',
    badge: 'bg-green-200 text-green-800'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    accent: 'bg-red-100',
    badge: 'bg-red-200 text-red-800'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    accent: 'bg-blue-100',
    badge: 'bg-blue-200 text-blue-800'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    accent: 'bg-orange-100',
    badge: 'bg-orange-200 text-orange-800'
  }
};

export default function SWOTCard({ title, items, color, icon, classYear, periodLabel }: SWOTCardProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SWOTElement | null>(null);
  const classes = colorClasses[color];

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Helper function to get prevalence label
  const getPrevalenceLabel = (prevalence: string): string => {
    const labels: { [key: string]: string } = {
      universal: 'Nearly All',
      majority: 'Most',
      common: 'Many',
      occasional: 'Some',
      rare: 'Few',
    };
    return labels[prevalence] || prevalence;
  };

  // Helper function to get prevalence badge styling
  const getPrevalenceBadgeStyle = (prevalence: string): string => {
    const baseStyles = 'font-medium text-xs px-2 py-1 rounded';
    
    if (color === 'green' || color === 'blue') {
      // Green shades for positive items (strengths, opportunities)
      const greenStyles: { [key: string]: string } = {
        universal: 'bg-green-600 text-white',
        majority: 'bg-green-500 text-white',
        common: 'bg-green-400 text-white',
        occasional: 'bg-green-300 text-green-900',
        rare: 'bg-gray-300 text-gray-700',
      };
      return `${baseStyles} ${greenStyles[prevalence] || 'bg-gray-300 text-gray-700'}`;
    } else {
      // Amber/red shades for negative items (weaknesses, threats)
      const amberStyles: { [key: string]: string } = {
        universal: 'bg-red-600 text-white',
        majority: 'bg-red-500 text-white',
        common: 'bg-amber-500 text-white',
        occasional: 'bg-amber-400 text-amber-900',
        rare: 'bg-gray-300 text-gray-700',
      };
      return `${baseStyles} ${amberStyles[prevalence] || 'bg-gray-300 text-gray-700'}`;
    }
  };

  return (
    <div className={`${classes.bg} ${classes.border} border-2 rounded-xl p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h4 className={`text-lg font-semibold ${classes.text}`}>
          {title}
        </h4>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${classes.badge}`}>
          {items.length}
        </span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-neutral-500 text-sm italic">No {title.toLowerCase()} identified</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className={`${classes.accent} rounded-lg p-4`}>
              {/* Main description */}
              <div className="flex items-start justify-between gap-2">
                <p className={`flex-1 ${classes.text} text-sm font-medium`}>
                  {item.description}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {item.prevalence && (
                    <span className={getPrevalenceBadgeStyle(item.prevalence)}>
                      {getPrevalenceLabel(item.prevalence)}
                    </span>
                  )}
                  {item.frequency && item.frequency > 1 && (
                    <span className={`text-xs px-2 py-1 rounded ${classes.badge}`}>
                      {item.frequency}×
                    </span>
                  )}
                </div>
              </div>

              {/* Citations (expandable) */}
              {item.supporting_quotes && item.supporting_quotes.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleItem(index)}
                      className={`flex items-center gap-1 text-xs ${classes.text} hover:underline`}
                    >
                      {expandedItems.has(index) ? (
                        <>
                          <ChevronUp size={14} />
                          Hide citations ({item.supporting_quotes.length})
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          Show citations ({item.supporting_quotes.length})
                        </>
                      )}
                    </button>

                    {/* View All Evidence Button */}
                    {classYear && periodLabel && (
                      <button
                        onClick={() => {
                          setSelectedElement(item);
                          setModalOpen(true);
                        }}
                        className={`flex items-center gap-1 text-xs ${classes.text} hover:underline font-medium`}
                      >
                        <ExternalLink size={14} />
                        View all supporting comments
                      </button>
                    )}
                  </div>

                  {expandedItems.has(index) && (
                    <div className="mt-3 space-y-2">
                      {item.supporting_quotes.map((quote, qIndex) => (
                        <div key={qIndex} className="pl-4 border-l-2 border-gray-300">
                          <p className="text-xs text-neutral-700 italic mb-1">
                            &quot;{quote.quote}&quot;
                          </p>
                          <p className="text-xs text-neutral-500">
                            — {quote.citation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evidence Modal */}
      {selectedElement && (
        <SWOTEvidenceModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedElement(null);
          }}
          swotElement={selectedElement}
          classYear={classYear}
          periodLabel={periodLabel || ''}
        />
      )}
    </div>
  );
}


