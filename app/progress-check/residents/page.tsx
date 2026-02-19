'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users, Search, ChevronDown, ChevronRight, Filter,
  BarChart3, AlertCircle, Database
} from 'lucide-react';
import { useRequireProgressCheckAuth, useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import { ScoreCard } from '@/components/eqpqiq/analytics';
import { calculatePGYLevel, formatPGYLevel, isResidentActive } from '@/lib/utils/pgy-calculator';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface Resident {
  id: string;
  name: string;
  anonCode: string;
  email: string | null;
  graduationYear: number | null;
  className: string | null;
  currentScores: {
    faculty_eq_avg?: number;
    faculty_pq_avg?: number;
    faculty_iq_avg?: number;
    faculty_n_raters?: number;
    self_eq_avg?: number;
    self_pq_avg?: number;
    self_iq_avg?: number;
    period_label?: string;
  } | null;
}

interface ClassInfo {
  id: string;
  graduation_year: number;
  name: string;
  is_active: boolean;
}

export default function ProgressCheckResidentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  const classYearFilter = searchParams.get('classYear');
  const expandClassParam = searchParams.get('expandClass');

  const [residents, setResidents] = useState<Resident[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(
    classYearFilter ? parseInt(classYearFilter) : null
  );
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(
    expandClassParam ? new Set([parseInt(expandClassParam)]) : new Set()
  );
  const [sortBy, setSortBy] = useState<'name' | 'eq' | 'pq' | 'iq' | 'composite'>('name');

  const fetchResidents = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ email: user.email });
      if (selectedClass) params.set('classYear', selectedClass.toString());

      const res = await fetch(`/api/progress-check/residents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setResidents(data.residents || []);
      setClasses(data.classes || []);

      // Accordions start collapsed
    } catch (err) {
      console.error('[ProgressCheckResidents] Error:', err);
      setError('Failed to load residents');
    } finally {
      setLoading(false);
    }
  }, [user?.email, selectedClass]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Filter and sort
  const filteredResidents = useMemo(() => {
    let result = [...residents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.anonCode?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const getScore = (r: Resident, field: string) => {
        const s = r.currentScores;
        if (!s) return -1;
        const key = `faculty_${field}_avg` as keyof typeof s;
        return (s[key] as number) || -1;
      };
      if (sortBy === 'composite') {
        const aS = a.currentScores;
        const bS = b.currentScores;
        const aScore = aS ? ((aS.faculty_eq_avg || 0) + (aS.faculty_pq_avg || 0) + (aS.faculty_iq_avg || 0)) / 3 : -1;
        const bScore = bS ? ((bS.faculty_eq_avg || 0) + (bS.faculty_pq_avg || 0) + (bS.faculty_iq_avg || 0)) / 3 : -1;
        return bScore - aScore;
      }
      return getScore(b, sortBy) - getScore(a, sortBy);
    });

    return result;
  }, [residents, searchQuery, sortBy]);

  // Group by class
  const residentsByClass = useMemo(() => {
    const groups: Record<number, Resident[]> = {};
    filteredResidents.forEach((r) => {
      const year = r.graduationYear || 0;
      if (!groups[year]) groups[year] = [];
      groups[year].push(r);
    });
    return groups;
  }, [filteredResidents]);

  const toggleClass = (year: number) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }} />
          <p className="text-slate-500">Loading residents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
            {user?.programSpecialty || 'Residents'}
          </h1>
          <p className="text-slate-600 mt-1">
            {residents.length} resident{residents.length !== 1 ? 's' : ''} across {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/progress-check/data')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-green-50"
          style={{ borderColor: COLORS.light, color: COLORS.dark }}
        >
          <Database className="w-4 h-4" />
          Raw Data
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.light }}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.light }}
          >
            <option value="">All Classes</option>
            {classes
              .sort((a, b) => b.graduation_year - a.graduation_year)
              .map((c) => {
                const pgy = calculatePGYLevel(c.graduation_year);
                const active = isResidentActive(c.graduation_year);
                const label = c.name || `Class of ${c.graduation_year}`;
                return (
                  <option key={c.id} value={c.graduation_year}>
                    {label} {active ? `(${formatPGYLevel(pgy)})` : '(Graduated)'}
                  </option>
                );
              })}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.light }}
          >
            <option value="name">Sort: Name</option>
            <option value="composite">Sort: Overall</option>
            <option value="eq">Sort: EQ</option>
            <option value="pq">Sort: PQ</option>
            <option value="iq">Sort: IQ</option>
          </select>
        </div>
      </div>

      {/* Residents by Class - active classes sorted PGY-3 first (nearest graduation), then graduated */}
      {Object.entries(residentsByClass)
        .sort(([a], [b]) => {
          const yearA = parseInt(a);
          const yearB = parseInt(b);
          const activeA = yearA > 0 && isResidentActive(yearA);
          const activeB = yearB > 0 && isResidentActive(yearB);
          // Active classes first, sorted by graduation year ascending (PGY-3 = nearest grad year first)
          if (activeA && activeB) return yearA - yearB;
          if (activeA && !activeB) return -1;
          if (!activeA && activeB) return 1;
          // Graduated classes: most recent first
          return yearB - yearA;
        })
        .map(([yearStr, classResidents]) => {
          const year = parseInt(yearStr);
          const classInfo = classes.find((c) => c.graduation_year === year);
          const isExpanded = expandedClasses.has(year);
          const pgyLevel = year > 0 ? calculatePGYLevel(year) : null;
          const active = year > 0 ? isResidentActive(year) : false;

          return (
            <div
              key={year}
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: COLORS.light }}
            >
              {/* Class Header */}
              <button
                onClick={() => toggleClass(year)}
                className="w-full p-4 flex items-center justify-between hover:bg-green-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" style={{ color: COLORS.dark }} />
                  ) : (
                    <ChevronRight className="w-5 h-5" style={{ color: COLORS.dark }} />
                  )}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {classInfo?.name || (year > 0 ? `Class of ${year}` : 'Unassigned')}
                      </p>
                      {pgyLevel !== null && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: active ? COLORS.lightest : '#F3F4F6',
                            color: active ? COLORS.darker : '#6B7280',
                          }}
                        >
                          {active ? formatPGYLevel(pgyLevel) : 'Graduated'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {classResidents.length} resident{classResidents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </button>

              {/* Resident List */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${COLORS.lightest}` }}>
                  {classResidents.map((resident, rIdx) => {
                    const scores = resident.currentScores;
                    const eq = scores?.faculty_eq_avg;
                    const pq = scores?.faculty_pq_avg;
                    const iq = scores?.faculty_iq_avg;
                    const hasScores = eq !== undefined && pq !== undefined && iq !== undefined;
                    const overall = hasScores ? Math.round(((eq || 0) + (pq || 0) + (iq || 0)) / 3) : null;

                    const getOverallColor = (score: number) => {
                      if (score >= 75) return { bg: '#F0FDF4', text: '#16A34A' };
                      if (score >= 50) return { bg: '#EFF6FF', text: '#2563EB' };
                      if (score >= 25) return { bg: '#FFFBEB', text: '#D97706' };
                      return { bg: '#FEF2F2', text: '#DC2626' };
                    };

                    return (
                      <div
                        key={resident.id}
                        className="p-4 flex items-center justify-between hover:bg-green-50/30 transition-colors cursor-pointer"
                        style={rIdx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}
                        onClick={() => router.push(`/progress-check/residents/${resident.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Overall score badge (or initials if no scores) */}
                          {overall !== null ? (
                            <div
                              className="flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                backgroundColor: getOverallColor(overall).bg,
                              }}
                            >
                              <span
                                className="text-lg font-bold leading-none"
                                style={{ color: getOverallColor(overall).text }}
                              >
                                {overall}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-center text-sm font-medium flex-shrink-0"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                backgroundColor: COLORS.lightest,
                                color: COLORS.darker,
                              }}
                            >
                              {resident.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{resident.name}</p>
                            {resident.anonCode && (
                              <p className="text-xs text-slate-400">{resident.anonCode}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasScores ? (
                            <ScoreCard eq={eq!} pq={pq!} iq={iq!} size="sm" showOverall={false} />
                          ) : (
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                              <BarChart3 className="w-3.5 h-3.5" />
                              No scores
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      {filteredResidents.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">No residents found</p>
          <p className="text-sm mt-1">
            {searchQuery ? 'Try adjusting your search query' : 'No residents in this program yet'}
          </p>
        </div>
      )}
    </div>
  );
}
