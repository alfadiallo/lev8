'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, BarChart3, Target, TrendingUp, Users } from 'lucide-react';

export default function ProgramWidePage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/modules/understand')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <Building2 className="text-[#4ECDC4]" size={32} />
            Program-Wide Analytics
          </h1>
          <p className="text-neutral-600 mt-1">
            Program-level insights across all residents and classes
          </p>
        </div>
      </div>

      {/* Program Info Card */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4ECDC4]/20 to-[#95E1D3]/20 flex items-center justify-center">
            <Building2 className="text-[#4ECDC4]" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">Emergency Medicine Residency</h2>
            <p className="text-neutral-600">Program-wide analytics across all classes and years</p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
        <div className="w-20 h-20 mx-auto bg-[#4ECDC4]/20 rounded-2xl flex items-center justify-center mb-6">
          <TrendingUp className="text-[#4ECDC4]" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-3">
          Program Analytics Coming Soon
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto mb-8">
          This view will provide longitudinal trends, year-over-year comparisons, and program-wide SWOT themes across all residents.
        </p>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="p-4 bg-neutral-50 rounded-xl">
            <Target size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Program SWOT</div>
            <div className="text-xs text-neutral-500 mt-1">Overarching themes</div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <BarChart3 size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Competencies</div>
            <div className="text-xs text-neutral-500 mt-1">ACGME tracking</div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <TrendingUp size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Year-over-Year</div>
            <div className="text-xs text-neutral-500 mt-1">Historical trends</div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <Users size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Benchmarks</div>
            <div className="text-xs text-neutral-500 mt-1">National comparisons</div>
          </div>
        </div>
      </div>
    </div>
  );
}
