// Historical Comparison Component
// Container for displaying historical class SWOT data

'use client';

import { useState, useEffect } from 'react';
import HistoricalClassCard from './HistoricalClassCard';
import { SWOTElement } from '@/lib/types/analytics';

interface HistoricalComparisonProps {
  periodLabel: string;
  swotType: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  excludeClassYear: number;
}

interface HistoricalData {
  class_year: number;
  period_label: string;
  items: SWOTElement[];
  n_comments_analyzed: number;
  ai_confidence: number;
}

export default function HistoricalComparison({
  periodLabel,
  swotType,
  excludeClassYear
}: HistoricalComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodLabel, swotType, excludeClassYear]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        period_label: periodLabel,
        swot_type: swotType,
        exclude_year: excludeClassYear.toString()
      });

      const response = await fetch(`/api/analytics/swot/class/compare?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();
      setHistoricalData(data.comparisons || []);
    } catch (err) {
      console.error('Error fetching historical comparison:', err);
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Historical Comparison</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Historical Comparison</h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-3">{error}</p>
          <button
            onClick={fetchHistoricalData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (historicalData.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Historical Comparison</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-neutral-600 font-medium mb-1">No Historical Data Available</p>
          <p className="text-neutral-500 text-sm">
            No other classes have data for {periodLabel} yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">
        Historical Comparison
        <span className="text-sm font-normal text-neutral-500 ml-2">
          ({historicalData.length} {historicalData.length === 1 ? 'class' : 'classes'})
        </span>
      </h3>
      
      <div className="space-y-3">
        {historicalData.map((data) => (
          <HistoricalClassCard
            key={data.class_year}
            classYear={data.class_year}
            periodLabel={data.period_label}
            swotType={swotType}
            items={data.items}
            nComments={data.n_comments_analyzed}
            confidence={data.ai_confidence}
          />
        ))}
      </div>
    </div>
  );
}


