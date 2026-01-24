'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { ArrowLeft, Users, BarChart3, Target, TrendingUp } from 'lucide-react';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

interface ClassOption {
  graduation_year: number;
  name: string;
  resident_count: number;
  current_pgy: number | null;
}

export default function ClassCohortPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // Fetch classes with resident counts
      const { data: classData, error } = await supabaseClient
        .from('classes')
        .select('graduation_year, name')
        .order('graduation_year', { ascending: false });

      if (error) throw error;

      // Count residents per class
      const { data: residents } = await supabaseClient
        .from('residents')
        .select('class_id, classes!inner(graduation_year)');

      const countMap = new Map<number, number>();
      residents?.forEach((r) => {
        const classObj = r.classes as unknown as { graduation_year?: number };
        const year = classObj?.graduation_year;
        if (year) {
          countMap.set(year, (countMap.get(year) || 0) + 1);
        }
      });

      const classesWithCounts: ClassOption[] = (classData || []).map(c => ({
        graduation_year: c.graduation_year,
        name: c.name,
        resident_count: countMap.get(c.graduation_year) || 0,
        current_pgy: calculatePGYLevel(c.graduation_year) > 0 ? calculatePGYLevel(c.graduation_year) : null,
      }));

      setClasses(classesWithCounts);
      if (classesWithCounts.length > 0) {
        setSelectedYear(classesWithCounts[0].graduation_year);
      }
    } catch (err) {
      console.error('[ClassCohort] Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.graduation_year === selectedYear);

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
            <Users className="text-[#7EC8E3]" size={32} />
            Class Cohort Analytics
          </h1>
          <p className="text-neutral-600 mt-1">
            View aggregated analytics by graduation year
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Select Class
        </label>
        {loading ? (
          <div className="animate-pulse bg-neutral-200 h-12 rounded-lg" />
        ) : (
          <div className="flex flex-wrap gap-3">
            {classes.map(c => (
              <button
                key={c.graduation_year}
                onClick={() => setSelectedYear(c.graduation_year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedYear === c.graduation_year
                    ? 'bg-[#7EC8E3] text-white shadow-md'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                Class of {c.graduation_year}
                {c.current_pgy && (
                  <span className="ml-2 text-xs opacity-80">
                    (PGY-{c.current_pgy})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {selectedClass && (
          <p className="text-sm text-neutral-500 mt-3">
            {selectedClass.resident_count} residents in this class
          </p>
        )}
      </div>

      {/* Placeholder Content */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
        <div className="w-20 h-20 mx-auto bg-[#7EC8E3]/20 rounded-2xl flex items-center justify-center mb-6">
          <BarChart3 className="text-[#7EC8E3]" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-3">
          Class Cohort Analytics Coming Soon
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto mb-8">
          This view will show aggregated SWOT analysis, EQ/PQ/IQ averages, and performance trends for the selected class.
        </p>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-neutral-50 rounded-xl">
            <Target size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Aggregated SWOT</div>
            <div className="text-xs text-neutral-500 mt-1">Class-wide themes</div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <BarChart3 size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Class Averages</div>
            <div className="text-xs text-neutral-500 mt-1">EQ/PQ/IQ scores</div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <TrendingUp size={24} className="text-neutral-400 mx-auto mb-2" />
            <div className="font-medium text-neutral-700">Trends</div>
            <div className="text-xs text-neutral-500 mt-1">Performance over time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
