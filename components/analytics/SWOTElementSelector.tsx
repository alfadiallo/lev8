// SWOT Element Selector Component
// Allows filtering SWOT analysis by specific categories

'use client';

export type SWOTElementType = 'all' | 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

interface SWOTElementSelectorProps {
  selectedElement: SWOTElementType;
  onChange: (element: SWOTElementType) => void;
}

export default function SWOTElementSelector({ selectedElement, onChange }: SWOTElementSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-neutral-700">SWOT Element:</label>
      <select
        value={selectedElement}
        onChange={(e) => onChange(e.target.value as SWOTElementType)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7EC8E3] focus:border-transparent text-sm"
      >
        <option value="all">All</option>
        <option value="strengths">Strengths</option>
        <option value="weaknesses">Weaknesses</option>
        <option value="opportunities">Opportunities</option>
        <option value="threats">Threats</option>
      </select>
    </div>
  );
}


