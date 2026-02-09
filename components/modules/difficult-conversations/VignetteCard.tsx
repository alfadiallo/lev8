// Vignette Card Component

'use client';

import { useRouter } from 'next/navigation';
import { Vignette } from '@/lib/types/modules';
import { Clock, Target } from 'lucide-react';

interface VignetteCardProps {
  vignette: Vignette;
}

export default function VignetteCard({ vignette }: VignetteCardProps) {
  const router = useRouter();

  const getDifficultyBadge = (difficulty: string) => {
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

  const difficulties = Array.isArray(vignette.difficulty) ? vignette.difficulty : [vignette.difficulty];

  return (
    <div
      onClick={() => router.push(`/modules/learn/difficult-conversations/${vignette.id}`)}
      className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/80 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-neutral-800 flex-1">{vignette.title}</h4>
        {difficulties.length > 0 && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${getDifficultyBadge(difficulties[0])}`}>
            {difficulties[0]}
          </span>
        )}
      </div>
      {vignette.description && (
        <p className="text-xs text-neutral-600 mb-3 line-clamp-2">{vignette.description}</p>
      )}
      {vignette.estimated_duration_minutes && (
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Clock size={12} />
          <span>{vignette.estimated_duration_minutes} min</span>
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/modules/learn/difficult-conversations/${vignette.id}`);
        }}
        className="w-full mt-3 bg-[#0EA5E9] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#0284C7] hover:shadow-lg transition-all duration-300"
      >
        Start
      </button>
    </div>
  );
}


