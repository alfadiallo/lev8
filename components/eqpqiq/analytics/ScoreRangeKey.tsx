'use client';

const TIERS = [
  { range: '0–20', label: 'Significant Concern', color: '#DC2626' },
  { range: '21–40', label: 'Below Expectations', color: '#D97706' },
  { range: '41–60', label: 'Meets Expectations', color: '#2563EB' },
  { range: '61–80', label: 'Exceeds Expectations', color: '#16A34A' },
  { range: '81–100', label: 'Exceptional', color: '#15803D' },
];

export default function ScoreRangeKey({ className = '' }: { className?: string }) {
  const firstRow = TIERS.slice(0, 3);
  const secondRow = TIERS.slice(3);

  const renderRow = (tiers: typeof TIERS) => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap text-[10px] sm:text-xs text-neutral-500">
      {tiers.map((tier, i) => (
        <span key={tier.range} className="flex items-center gap-1">
          {i > 0 && <span className="text-neutral-300 mr-0.5">·</span>}
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: tier.color }}
          />
          <span className="whitespace-nowrap">
            <span className="font-medium" style={{ color: tier.color }}>
              {tier.range}
            </span>{' '}
            {tier.label}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`space-y-1 ${className}`}>
      {renderRow(firstRow)}
      {renderRow(secondRow)}
    </div>
  );
}
