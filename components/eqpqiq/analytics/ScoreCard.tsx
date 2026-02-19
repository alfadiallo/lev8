'use client';

interface ScoreCardProps {
  eq: number;
  pq: number;
  iq: number;
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showOverall?: boolean;
  onClick?: () => void;
  className?: string;
}

const COLORS = {
  eq: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  pq: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  iq: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
};

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-blue-600';
  if (score >= 25) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Compact EQ/PQ/IQ score display tile.
 * Used in resident lists, provider lists, candidate lists.
 */
export default function ScoreCard({
  eq,
  pq,
  iq,
  label,
  sublabel,
  size = 'md',
  showOverall = true,
  onClick,
  className = '',
}: ScoreCardProps) {
  const overall = (eq + pq + iq) / 3;

  const sizeClasses = {
    sm: { score: 'text-lg', label: 'text-[10px]', padding: 'px-3 py-2', gap: 'gap-2.5' },
    md: { score: 'text-2xl', label: 'text-xs', padding: 'p-3', gap: 'gap-3' },
    lg: { score: 'text-3xl', label: 'text-sm', padding: 'p-4', gap: 'gap-4' },
  }[size];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`${sizeClasses.padding} ${
        onClick ? 'hover:opacity-80 cursor-pointer transition-all' : ''
      } ${className}`}
    >
      {/* Header */}
      {(label || sublabel) && (
        <div className="mb-2">
          {label && <div className="font-semibold text-neutral-900 text-sm truncate">{label}</div>}
          {sublabel && <div className="text-xs text-neutral-500 truncate">{sublabel}</div>}
        </div>
      )}

      {/* Scores */}
      <div className={`flex items-center ${sizeClasses.gap}`}>
        {[
          { key: 'eq' as const, value: eq, label: 'EQ' },
          { key: 'pq' as const, value: pq, label: 'PQ' },
          { key: 'iq' as const, value: iq, label: 'IQ' },
        ].map(({ key, value, label: scoreLabel }) => (
          <div
            key={key}
            className={`flex-1 min-w-[3.75rem] text-center ${COLORS[key].bg} rounded-md px-2 py-1.5 border ${COLORS[key].border}`}
          >
            <div className={`${sizeClasses.score} font-bold ${COLORS[key].text}`}>
              {value > 0 ? Math.round(value) : '—'}
            </div>
            <div className={`${sizeClasses.label} font-medium text-neutral-500`}>{scoreLabel}</div>
          </div>
        ))}
      </div>

      {/* Overall */}
      {showOverall && (
        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Overall</span>
          <span className={`font-bold ${sizeClasses.score} ${getScoreColor(overall)}`}>
            {overall > 0 ? Math.round(overall) : '—'}
          </span>
        </div>
      )}
    </Component>
  );
}
