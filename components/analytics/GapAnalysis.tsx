// Gap Analysis Component
// Shows the difference between self-assessment and faculty ratings

'use client';

interface GapAnalysisProps {
  gapEQ: number | null;
  gapPQ: number | null;
  gapIQ: number | null;
}

export default function GapAnalysis({ gapEQ, gapPQ, gapIQ }: GapAnalysisProps) {
  const renderGap = (value: number | null, label: string) => {
    if (value === null) return null;

    const absValue = Math.abs(value);
    const isOverestimate = value > 0;
    const isSignificant = absValue >= 0.5;

    return (
      <div className={`p-4 rounded-lg ${isSignificant ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">{label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${isOverestimate ? 'text-orange-600' : 'text-blue-600'}`}>
              {isOverestimate ? '+' : ''}{value.toFixed(2)}
            </span>
            {isOverestimate ? (
              <span className="text-xs text-orange-600">Overestimate</span>
            ) : (
              <span className="text-xs text-blue-600">Underestimate</span>
            )}
          </div>
        </div>
        {isSignificant && (
          <p className="text-xs text-yellow-700 mt-2">
            {isOverestimate
              ? 'Self-perception significantly higher than faculty ratings'
              : 'Self-perception significantly lower than faculty ratings'}
          </p>
        )}
      </div>
    );
  };

  const hasAnyGap = gapEQ !== null || gapPQ !== null || gapIQ !== null;

  if (!hasAnyGap) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h4 className="text-md font-semibold text-neutral-800 mb-4">Gap Analysis (Self - Faculty)</h4>
      <div className="space-y-3">
        {renderGap(gapEQ, 'EQ Gap')}
        {renderGap(gapPQ, 'PQ Gap')}
        {renderGap(gapIQ, 'IQ Gap')}
      </div>
      <div className="mt-4 text-xs text-neutral-600 bg-gray-50 p-3 rounded">
        <strong>Interpretation:</strong> Positive values indicate you rate yourself higher than faculty do.
        Negative values suggest you may be underestimating your abilities. Gaps ≥ 0.5 are considered significant.
      </div>
    </div>
  );
}



