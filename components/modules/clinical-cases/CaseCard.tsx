// Case Card Component

'use client';

import { useRouter } from 'next/navigation';
import { ClinicalCase } from '@/lib/types/modules';
import { Clock, User } from 'lucide-react';

interface CaseCardProps {
  case_: ClinicalCase;
}

export default function CaseCard({ case_ }: CaseCardProps) {
  const router = useRouter();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-[#86C5A8]/20 text-[#86C5A8] border-[#86C5A8]/30';
      case 'intermediate':
        return 'bg-[#FFD89B]/20 text-[#FFD89B] border-[#FFD89B]/30';
      case 'advanced':
        return 'bg-[#F4A5A5]/20 text-[#F4A5A5] border-[#F4A5A5]/30';
      default:
        return 'bg-neutral-200 text-neutral-600 border-neutral-300';
    }
  };

  return (
    <div
      onClick={() => router.push(`/modules/learn/clinical-cases/${case_.id}`)}
      className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30 hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-neutral-800 flex-1">{case_.title}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${getDifficultyColor(case_.difficulty)}`}>
          {case_.difficulty}
        </span>
      </div>

      {case_.description && (
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{case_.description}</p>
      )}

      <div className="space-y-2 mb-4">
        {case_.estimated_duration_minutes && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock size={16} />
            <span>{case_.estimated_duration_minutes} minutes</span>
          </div>
        )}
        {case_.specialty && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <User size={16} />
            <span>{case_.specialty}</span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/modules/learn/clinical-cases/${case_.id}`);
        }}
        className="w-full bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
      >
        Start Case
      </button>
    </div>
  );
}


