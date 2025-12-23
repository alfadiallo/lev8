// Period Selector Component
// Allows filtering data by period (PGY-X Fall/Spring)

'use client';

interface PeriodSelectorProps {
  periods: string[];
  selectedPeriod: string;
  onChange: (period: string) => void;
}

export default function PeriodSelector({ periods, selectedPeriod, onChange }: PeriodSelectorProps) {
  if (periods.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-neutral-700">Period:</label>
      <select
        value={selectedPeriod}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7EC8E3] focus:border-transparent text-sm"
      >
        <option value="all">All Periods</option>
        {periods.map((period) => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>
    </div>
  );
}


