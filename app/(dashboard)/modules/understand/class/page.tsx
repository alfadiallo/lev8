'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Info
} from 'lucide-react';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';
import type { ScatterDataPoint } from '@/components/charts/D3ArchetypeScatterChart';

// Dynamically import the scatter chart to avoid SSR issues with D3
const D3ArchetypeScatterChart = dynamic(
  () => import('@/components/charts/D3ArchetypeScatterChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center bg-neutral-50 rounded-xl animate-pulse">
        <span className="text-neutral-400">Loading chart...</span>
      </div>
    )
  }
);

interface ClassOption {
  graduation_year: number;
  name: string;
  resident_count: number;
  current_pgy: number | null;
}

interface ArchetypeDistribution {
  archetype: string;
  count: number;
  percentage: number;
  color: string;
  riskLevel: string;
}

interface ClassArchetypeData {
  graduationYear: number;
  className: string;
  totalResidents: number;
  residentsWithData: number;
  residents: ScatterDataPoint[];
  archetypeDistribution: ArchetypeDistribution[];
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
}

export default function ClassCohortPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [archetypeData, setArchetypeData] = useState<ClassArchetypeData | null>(null);
  const [archetypeLoading, setArchetypeLoading] = useState(false);
  const [expandedArchetypes, setExpandedArchetypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // Use V2 API to get residents (tenant-filtered automatically)
      const response = await fetch('/api/v2/residents?include_graduated=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch residents');
      }
      
      const data = await response.json();
      
      // Group residents by graduation year
      const countMap = new Map<number, { count: number; className: string }>();
      
      for (const resident of (data.residents || [])) {
        const year = resident.graduationYear;
        if (year) {
          const existing = countMap.get(year);
          if (existing) {
            existing.count++;
          } else {
            countMap.set(year, { 
              count: 1, 
              className: resident.className || `Class of ${year}` 
            });
          }
        }
      }
      
      // Convert to array and sort
      const classesWithCounts: ClassOption[] = Array.from(countMap.entries())
        .map(([year, info]) => ({
          graduation_year: year,
          name: info.className,
          resident_count: info.count,
          current_pgy: calculatePGYLevel(year) > 0 ? calculatePGYLevel(year) : null,
        }))
        .sort((a, b) => b.graduation_year - a.graduation_year);

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

  const fetchArchetypeData = useCallback(async (year: number) => {
    setArchetypeLoading(true);
    try {
      const response = await fetch(`/api/archetypes/class/${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch archetype data');
      }
      const data = await response.json();
      setArchetypeData(data);
    } catch (err) {
      console.error('[ClassCohort] Error fetching archetype data:', err);
      setArchetypeData(null);
    } finally {
      setArchetypeLoading(false);
    }
  }, []);

  // Fetch archetype data when selected year changes
  useEffect(() => {
    if (selectedYear) {
      fetchArchetypeData(selectedYear);
    }
  }, [selectedYear, fetchArchetypeData]);

  const handleResidentClick = (residentId: string) => {
    router.push(`/modules/understand/residents?resident=${residentId}`);
  };

  const toggleArchetypeExpanded = (archetype: string) => {
    setExpandedArchetypes(prev => {
      const next = new Set(prev);
      if (next.has(archetype)) {
        next.delete(archetype);
      } else {
        next.add(archetype);
      }
      return next;
    });
  };

  // Get residents for a specific archetype
  const getResidentsForArchetype = (archetype: string) => {
    if (!archetypeData) return [];
    return archetypeData.residents.filter(r => r.archetype === archetype);
  };

  // Risk level descriptions
  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'On track for success. Standard monitoring recommended.';
      case 'Moderate':
        return 'Trajectory needs watching. Proactive check-ins recommended.';
      case 'High':
        return 'At risk pattern detected. Intervention and close monitoring needed.';
      default:
        return 'Risk level not determined.';
    }
  };

  const selectedClass = classes.find(c => c.graduation_year === selectedYear);

  return (
    <div className="max-w-7xl mx-auto">
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
            View ITE trajectory archetypes by graduation year
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
            {classes.map(c => {
              // Check if class has graduated (graduation year <= current academic year)
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear();
              const currentMonth = currentDate.getMonth();
              // Academic year starts July 1, so if we're past July, we're in the next academic year
              const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;
              const isGraduated = c.graduation_year <= academicYear;
              
              return (
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
                  <span className="ml-2 text-xs opacity-80">
                    {isGraduated ? '(Graduated)' : c.current_pgy ? `(PGY-${c.current_pgy})` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {selectedClass && (
          <p className="text-sm text-neutral-500 mt-3">
            {selectedClass.resident_count} residents in this class
            {archetypeData && archetypeData.residentsWithData > 0 && (
              <span className="ml-2">
                • {archetypeData.residentsWithData} with ITE data
              </span>
            )}
          </p>
        )}
      </div>

      {/* Main Content */}
      {archetypeLoading ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw size={32} className="text-[#7EC8E3] animate-spin mb-4" />
            <p className="text-neutral-600">Loading archetype data...</p>
          </div>
        </div>
      ) : archetypeData && archetypeData.residentsWithData > 0 ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {/* Total Residents */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#7EC8E3]/20 flex items-center justify-center">
                  <Users size={20} className="text-[#7EC8E3]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-800">{archetypeData.residentsWithData}</p>
                  <p className="text-xs text-neutral-500">With ITE Data</p>
                </div>
              </div>
            </div>

            {/* Low Risk */}
            <div 
              className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 cursor-help"
              title={getRiskDescription('Low')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-green-600">{archetypeData.riskDistribution.low}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    Low Risk
                    <Info size={10} className="text-neutral-400" />
                  </p>
                </div>
              </div>
            </div>

            {/* Moderate Risk */}
            <div 
              className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 cursor-help"
              title={getRiskDescription('Moderate')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-amber-600">{archetypeData.riskDistribution.moderate}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    Moderate Risk
                    <Info size={10} className="text-neutral-400" />
                  </p>
                </div>
              </div>
            </div>

            {/* High Risk */}
            <div 
              className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 cursor-help"
              title={getRiskDescription('High')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-red-600">{archetypeData.riskDistribution.high}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    High Risk
                    <Info size={10} className="text-neutral-400" />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="p-6 border-b border-neutral-200/50">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#7EC8E3]" />
                ITE Trajectory Scatter Plot
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Each dot represents a resident. X-axis shows PGY-1 percentile, Y-axis shows change from PGY-1 to PGY-2.
              </p>
            </div>
            <div className="p-6">
              <D3ArchetypeScatterChart
                data={archetypeData.residents}
                width={800}
                height={450}
                onResidentClick={handleResidentClick}
              />
            </div>
          </div>

          {/* Archetype Distribution */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="p-6 border-b border-neutral-200/50">
              <h2 className="text-lg font-semibold text-neutral-800">Archetype Distribution</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Click to expand and see residents in each category
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {archetypeData.archetypeDistribution.map(item => {
                  const isExpanded = expandedArchetypes.has(item.archetype);
                  const residents = getResidentsForArchetype(item.archetype);
                  
                  return (
                    <div
                      key={item.archetype}
                      className="rounded-lg border border-neutral-200 bg-white/50 overflow-hidden"
                    >
                      {/* Archetype Header - Clickable */}
                      <button
                        onClick={() => toggleArchetypeExpanded(item.archetype)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <div className="text-neutral-400">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-800">{item.archetype}</p>
                          <p className="text-xs text-neutral-500">
                            {item.count} resident{item.count !== 1 ? 's' : ''} ({item.percentage}%)
                          </p>
                        </div>
                        <span 
                          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 cursor-help ${
                            item.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                            item.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}
                          title={`${item.riskLevel} Risk: ${getRiskDescription(item.riskLevel)}`}
                        >
                          {item.riskLevel}
                          <Info size={12} className="opacity-60" />
                        </span>
                      </button>
                      
                      {/* Expanded Residents List */}
                      {isExpanded && residents.length > 0 && (
                        <div className="border-t border-neutral-200 bg-neutral-50/50">
                          <div className="divide-y divide-neutral-100">
                            {residents.map(resident => (
                              <button
                                key={resident.id}
                                onClick={() => handleResidentClick(resident.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                  <User size={14} className="text-neutral-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-neutral-700 text-sm">{resident.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                                    {resident.pgy1 !== null && (
                                      <span>PGY-1: {resident.pgy1}%</span>
                                    )}
                                    {resident.pgy2 !== null && (
                                      <span>PGY-2: {resident.pgy2}%</span>
                                    )}
                                    {resident.delta !== null && (
                                      <span className={resident.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        Δ {resident.delta > 0 ? '+' : ''}{resident.delta}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-neutral-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Data State */
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
          <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="text-neutral-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-3">
            No ITE Data Available
          </h2>
          <p className="text-neutral-600 max-w-md mx-auto">
            {selectedClass 
              ? `No ITE scores have been recorded for ${selectedClass.name} yet. Once ITE data is imported, trajectory archetypes will appear here.`
              : 'Select a class to view ITE trajectory analysis.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
