// SWOT Tab Component
// Displays SWOT analysis with period selection and expandable cards

'use client';

import { useState } from 'react';
import { Info, BarChart3 } from 'lucide-react';
import { SWOTSummary, PeriodScore } from '@/lib/types/analytics';
import SWOTCard from './SWOTCard';
import PeriodSelector from './PeriodSelector';
import SWOTElementSelector, { SWOTElementType } from './SWOTElementSelector';
import HistoricalComparison from './HistoricalComparison';
import RubricModal from './RubricModal';
import { AttributeTimelineChartD3 } from './AttributeTimelineChartD3';

interface SWOTTabProps {
  swotData: SWOTSummary[];
  scoresData?: PeriodScore[];
  loading?: boolean;
  residentId?: string;
  classYear?: number;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  selectedElement?: SWOTElementType;
  onElementChange?: (element: SWOTElementType) => void;
  showCitations?: boolean;
}

export default function SWOTTab({ 
  swotData,
  scoresData = [],
  loading, 
  residentId,
  classYear,
  selectedPeriod: externalSelectedPeriod,
  onPeriodChange,
  selectedElement: externalSelectedElement,
  onElementChange,
  showCitations = false
}: SWOTTabProps) {
  const [internalSelectedPeriod, setInternalSelectedPeriod] = useState<string>('all');
  const [internalSelectedElement, setInternalSelectedElement] = useState<SWOTElementType>('all');
  const [showRubricModal, setShowRubricModal] = useState(false);
  
  // Use external period if provided, otherwise use internal state
  const selectedPeriod = externalSelectedPeriod || internalSelectedPeriod;
  const setSelectedPeriod = onPeriodChange || setInternalSelectedPeriod;
  
  // Use external element if provided, otherwise use internal state
  const selectedElement = externalSelectedElement || internalSelectedElement;
  const setSelectedElement = onElementChange || setInternalSelectedElement;

  // Filter data by period
  const filteredData = selectedPeriod === 'all'
    ? swotData
    : swotData.filter(s => s.period_label === selectedPeriod);
  
  // Filter scores data by period
  const filteredScores = selectedPeriod === 'all'
    ? scoresData
    : scoresData.filter(s => s.period_label === selectedPeriod);

  // Get unique periods for selector
  const periods = Array.from(new Set(swotData.map(s => s.period_label))).sort().reverse();

  // Determine if we should show historical comparison
  // Only show when both period and element are specific (not "all")
  const shouldShowComparison = 
    selectedPeriod !== 'all' && 
    selectedElement !== 'all' &&
    selectedPeriod !== '' &&
    classYear !== undefined &&
    swotData.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
        ))}
      </div>
    );
  }

  if (swotData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <BarChart3 size={64} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">No SWOT Data Available</h3>
        <p className="text-neutral-600">
          SWOT analysis will be generated once evaluation data is available and processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="flex items-center gap-6 mb-6">
        <PeriodSelector
          periods={periods}
          selectedPeriod={selectedPeriod}
          onChange={setSelectedPeriod}
        />
        <SWOTElementSelector
          selectedElement={selectedElement}
          onChange={setSelectedElement}
        />
        
        {/* Rubric Info Icon */}
        <button
          onClick={() => setShowRubricModal(true)}
          className="ml-auto p-2 text-neutral-500 hover:text-neutral-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="View analysis rubric"
          aria-label="View SWOT analysis rubric"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Rubric Modal */}
      <RubricModal 
        isOpen={showRubricModal}
        onClose={() => setShowRubricModal(false)}
      />

      {/* AI-Generated Attribute Scores Timeline (D3.js visualization) */}
      {scoresData.length > 0 && scoresData.some(s => s.ai_scores_detail) && (
        <AttributeTimelineChartD3 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allPeriodScores={scoresData as any} 
          residentId={residentId}
          classYear={classYear}
        />
      )}

      {/* Display SWOT for each period (reverse chronological) */}
      {filteredData.map((swot) => (
        <div key={swot.id} className="space-y-4">
          {/* Period Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">{swot.period_label}</h3>
            <div className="text-sm text-neutral-600">
              Based on {swot.n_comments_analyzed} evaluation{swot.n_comments_analyzed !== 1 ? 's' : ''}
              {swot.ai_confidence && (
                <span className="ml-2">
                  • {Math.round(swot.ai_confidence * 100)}% confidence
                </span>
              )}
            </div>
          </div>

          {/* Two-column layout when comparison is enabled */}
          {shouldShowComparison ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Left column: Current class SWOT */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                  Current Class
                </h3>
                {/* Strengths */}
                {selectedElement === 'strengths' && (
                  <SWOTCard
                    title="Strengths"
                    items={swot.strengths}
                    color="green"
                    icon="💪"
                    classYear={classYear}
                    periodLabel={swot.period_label}
                  />
                )}

                {/* Weaknesses */}
                {selectedElement === 'weaknesses' && (
                  <SWOTCard
                    title="Weaknesses"
                    items={swot.weaknesses}
                    color="red"
                    icon="⚠️"
                    classYear={classYear}
                    periodLabel={swot.period_label}
                  />
                )}

                {/* Opportunities */}
                {selectedElement === 'opportunities' && (
                  <SWOTCard
                    title="Opportunities"
                    items={swot.opportunities}
                    color="blue"
                    icon="🎯"
                    classYear={classYear}
                    periodLabel={swot.period_label}
                  />
                )}

                {/* Threats */}
                {selectedElement === 'threats' && (
                  <SWOTCard
                    title="Threats"
                    items={swot.threats}
                    color="orange"
                    icon="🚧"
                    classYear={classYear}
                    periodLabel={swot.period_label}
                  />
                )}
              </div>

              {/* Right column: Historical comparison */}
              <div>
                <HistoricalComparison
                  periodLabel={swot.period_label}
                  swotType={selectedElement as 'strengths' | 'weaknesses' | 'opportunities' | 'threats'}
                  excludeClassYear={classYear!}
                />
              </div>
            </div>
          ) : (
            /* Single-column layout when comparison is disabled */
            <div className={selectedElement === 'all' ? 'grid md:grid-cols-2 gap-4' : 'max-w-2xl mx-auto'}>
              {/* Strengths */}
              {(selectedElement === 'all' || selectedElement === 'strengths') && (
                <SWOTCard
                  title="Strengths"
                  items={swot.strengths}
                  color="green"
                  icon="💪"
                  classYear={classYear}
                  periodLabel={swot.period_label}
                />
              )}

              {/* Weaknesses */}
              {(selectedElement === 'all' || selectedElement === 'weaknesses') && (
                <SWOTCard
                  title="Weaknesses"
                  items={swot.weaknesses}
                  color="red"
                  icon="⚠️"
                  classYear={classYear}
                  periodLabel={swot.period_label}
                />
              )}

              {/* Opportunities */}
              {(selectedElement === 'all' || selectedElement === 'opportunities') && (
                <SWOTCard
                  title="Opportunities"
                  items={swot.opportunities}
                  color="blue"
                  icon="🎯"
                  classYear={classYear}
                  periodLabel={swot.period_label}
                />
              )}

              {/* Threats */}
              {(selectedElement === 'all' || selectedElement === 'threats') && (
                <SWOTCard
                  title="Threats"
                  items={swot.threats}
                  color="orange"
                  icon="🚧"
                  classYear={classYear}
                  periodLabel={swot.period_label}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


