'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ChevronUp, ChevronDown, Download, AlertCircle } from 'lucide-react';
import { useRequireProgressCheckAuth } from '@/context/ProgressCheckUserContext';
import { calculatePGYLevel, formatPGYLevel, isResidentActive } from '@/lib/utils/pgy-calculator';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

const SECTION = {
  EQ: { color: '#2563EB', bg: '#EFF6FF', label: 'EQ' },
  PQ: { color: '#16A34A', bg: '#F0FDF4', label: 'PQ' },
  IQ: { color: '#9333EA', bg: '#FAF5FF', label: 'IQ' },
};

interface ClassInfo {
  id: string;
  graduation_year: number;
  name: string;
  is_active: boolean;
}

interface RawRow {
  id: string;
  residentName: string;
  residentId: string;
  graduationYear: number | null;
  raterType: string;
  evaluatorName: string;
  evaluationDate: string;
  periodLabel: string | null;
  eq_empathy_positive_interactions: number | null;
  eq_adaptability_self_awareness: number | null;
  eq_stress_management_resilience: number | null;
  eq_curiosity_growth_mindset: number | null;
  eq_effectiveness_communication: number | null;
  pq_work_ethic_reliability: number | null;
  pq_integrity_accountability: number | null;
  pq_teachability_receptiveness: number | null;
  pq_documentation: number | null;
  pq_leadership_relationships: number | null;
  iq_knowledge_base: number | null;
  iq_analytical_thinking: number | null;
  iq_commitment_learning: number | null;
  iq_clinical_flexibility: number | null;
  iq_performance_for_level: number | null;
  eqAvg: number | null;
  pqAvg: number | null;
  iqAvg: number | null;
  comments: string | null;
}

type SortKey = keyof RawRow;
type SortDir = 'asc' | 'desc';

const RATER_LABELS: Record<string, string> = {
  core_faculty: 'Core Faculty',
  teaching_faculty: 'Teaching Faculty',
  self: 'Self',
};

// Column definitions grouped by section
const COLUMNS: {
  key: SortKey;
  label: string;
  section?: 'EQ' | 'PQ' | 'IQ';
  isAvg?: boolean;
  wide?: boolean;
}[] = [
  { key: 'residentName', label: 'Resident', wide: true },
  { key: 'raterType', label: 'Rater Type' },
  { key: 'evaluatorName', label: 'Evaluator' },
  { key: 'evaluationDate', label: 'Date' },
  { key: 'periodLabel', label: 'Period' },
  // EQ
  { key: 'eq_empathy_positive_interactions', label: 'Empathy', section: 'EQ' },
  { key: 'eq_adaptability_self_awareness', label: 'Adapt.', section: 'EQ' },
  { key: 'eq_stress_management_resilience', label: 'Stress', section: 'EQ' },
  { key: 'eq_curiosity_growth_mindset', label: 'Curiosity', section: 'EQ' },
  { key: 'eq_effectiveness_communication', label: 'Comm.', section: 'EQ' },
  { key: 'eqAvg', label: 'EQ', section: 'EQ', isAvg: true },
  // PQ
  { key: 'pq_work_ethic_reliability', label: 'Work Ethic', section: 'PQ' },
  { key: 'pq_integrity_accountability', label: 'Integrity', section: 'PQ' },
  { key: 'pq_teachability_receptiveness', label: 'Teach.', section: 'PQ' },
  { key: 'pq_documentation', label: 'Docs', section: 'PQ' },
  { key: 'pq_leadership_relationships', label: 'Leader.', section: 'PQ' },
  { key: 'pqAvg', label: 'PQ', section: 'PQ', isAvg: true },
  // IQ
  { key: 'iq_knowledge_base', label: 'Knowledge', section: 'IQ' },
  { key: 'iq_analytical_thinking', label: 'Analytical', section: 'IQ' },
  { key: 'iq_commitment_learning', label: 'Learning', section: 'IQ' },
  { key: 'iq_clinical_flexibility', label: 'Flexibility', section: 'IQ' },
  { key: 'iq_performance_for_level', label: 'Perform.', section: 'IQ' },
  { key: 'iqAvg', label: 'IQ', section: 'IQ', isAvg: true },
  // Comments
  { key: 'comments', label: 'Comments', wide: true },
];

export default function RawDataPage() {
  const router = useRouter();
  const { user } = useRequireProgressCheckAuth();

  const [rows, setRows] = useState<RawRow[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [raterFilter, setRaterFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('evaluationDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/progress-check/data?email=${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setRows(result.rows || []);
      setPeriods(result.periods || []);
      setClasses(result.classes || []);
    } catch (err) {
      console.error('[RawData] Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter + sort
  const filtered = useMemo(() => {
    let data = rows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.residentName.toLowerCase().includes(q) ||
          r.evaluatorName.toLowerCase().includes(q)
      );
    }
    if (raterFilter !== 'all') {
      data = data.filter((r) => r.raterType === raterFilter);
    }
    if (periodFilter !== 'all') {
      data = data.filter((r) => r.periodLabel === periodFilter);
    }
    if (classFilter !== 'all') {
      const yr = parseInt(classFilter);
      data = data.filter((r) => r.graduationYear === yr);
    }
    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    data = [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
    return data;
  }, [rows, search, raterFilter, periodFilter, classFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = COLUMNS.map((c) => c.label);
    const csvRows = filtered.map((r) =>
      COLUMNS.map((c) => {
        const val = r[c.key];
        if (val == null) return '';
        if (c.key === 'raterType') return RATER_LABELS[val as string] || val;
        if (typeof val === 'number') return Math.round(val);
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      }).join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-check-raw-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtScore = (val: number | null) => (val != null ? Math.round(val) : '—');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div
            className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto"
            style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }}
          />
          <p className="text-slate-500">Loading raw data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-lg font-medium text-slate-900">Error Loading Data</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.push('/progress-check/residents')}
          className="p-2 rounded-lg hover:bg-green-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: COLORS.dark }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: COLORS.veryDark }}>
            Raw Data
          </h1>
          <p className="text-sm text-slate-500">
            {filtered.length} of {rows.length} evaluations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-green-50"
          style={{ borderColor: COLORS.light, color: COLORS.dark }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resident or evaluator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
            style={{ borderColor: COLORS.light }}
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-white"
          style={{ borderColor: COLORS.light }}
        >
          <option value="all">All Classes</option>
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
          value={raterFilter}
          onChange={(e) => setRaterFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-white"
          style={{ borderColor: COLORS.light }}
        >
          <option value="all">All Rater Types</option>
          <option value="core_faculty">Core Faculty</option>
          <option value="teaching_faculty">Teaching Faculty</option>
          <option value="self">Self</option>
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-white"
          style={{ borderColor: COLORS.light }}
        >
          <option value="all">All Periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: COLORS.light }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            {/* Section group headers */}
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.light}` }}>
                {/* First 5 meta columns span */}
                <th colSpan={5} className="bg-slate-50" />
                {/* EQ group */}
                <th
                  colSpan={6}
                  className="text-center py-1.5 text-xs font-bold tracking-wider border-l border-r"
                  style={{
                    color: SECTION.EQ.color,
                    backgroundColor: SECTION.EQ.bg,
                    borderColor: '#DBEAFE',
                  }}
                >
                  EMOTIONAL (EQ)
                </th>
                {/* PQ group */}
                <th
                  colSpan={6}
                  className="text-center py-1.5 text-xs font-bold tracking-wider border-r"
                  style={{
                    color: SECTION.PQ.color,
                    backgroundColor: SECTION.PQ.bg,
                    borderColor: '#DCFCE7',
                  }}
                >
                  PROFESSIONAL (PQ)
                </th>
                {/* IQ group */}
                <th
                  colSpan={6}
                  className="text-center py-1.5 text-xs font-bold tracking-wider border-r"
                  style={{
                    color: SECTION.IQ.color,
                    backgroundColor: SECTION.IQ.bg,
                    borderColor: '#F3E8FF',
                  }}
                >
                  INTELLECTUAL (IQ)
                </th>
                {/* Comments */}
                <th className="bg-slate-50" />
              </tr>
              {/* Column headers */}
              <tr style={{ borderBottom: `1px solid ${COLORS.light}` }}>
                {COLUMNS.map((col) => {
                  const isSorted = sortKey === col.key;
                  const sectionStyle = col.section ? SECTION[col.section] : null;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-2 py-2.5 text-left font-medium cursor-pointer select-none whitespace-nowrap hover:bg-slate-100 transition-colors ${
                        col.key === 'residentName' ? 'sticky left-0 z-10 bg-white' : ''
                      } ${col.isAvg ? 'font-bold' : ''}`}
                      style={{
                        color: sectionStyle ? sectionStyle.color : '#475569',
                        backgroundColor:
                          col.key === 'residentName'
                            ? 'white'
                            : col.isAvg && sectionStyle
                              ? sectionStyle.bg
                              : undefined,
                        minWidth: col.wide ? 160 : col.key === 'comments' ? 200 : 70,
                        fontSize: '11px',
                      }}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {isSorted && (
                          sortDir === 'asc'
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-12 text-slate-500">
                    No data matches the current filters
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    {COLUMNS.map((col) => {
                      const val = row[col.key];
                      let display: React.ReactNode;

                      if (col.key === 'residentName') {
                        display = (
                          <span className="font-medium text-slate-900">{val as string}</span>
                        );
                      } else if (col.key === 'raterType') {
                        const label = RATER_LABELS[val as string] || (val as string);
                        const isTeaching = val === 'teaching_faculty';
                        const isFac = val === 'core_faculty' || val === 'teaching_faculty';
                        display = (
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{
                              backgroundColor: isTeaching
                                ? '#FEF3C7'
                                : isFac
                                  ? COLORS.lightest
                                  : '#EDE9FE',
                              color: isTeaching
                                ? '#92400E'
                                : isFac
                                  ? COLORS.darker
                                  : '#5B21B6',
                            }}
                          >
                            {label}
                          </span>
                        );
                      } else if (col.key === 'evaluationDate') {
                        display = val
                          ? new Date(val as string).toLocaleDateString()
                          : '—';
                      } else if (col.key === 'comments') {
                        display = val ? (
                          <span
                            className="text-xs text-slate-600 italic truncate block max-w-[250px]"
                            title={val as string}
                          >
                            {val as string}
                          </span>
                        ) : null;
                      } else if (typeof val === 'number') {
                        const sectionStyle = col.section ? SECTION[col.section] : null;
                        display = (
                          <span
                            className={col.isAvg ? 'font-bold' : ''}
                            style={col.isAvg && sectionStyle ? { color: sectionStyle.color } : undefined}
                          >
                            {fmtScore(val)}
                          </span>
                        );
                      } else if (val == null) {
                        display = <span className="text-slate-300">—</span>;
                      } else {
                        display = val as string;
                      }

                      return (
                        <td
                          key={col.key}
                          className={`px-2 py-2 ${
                            col.key === 'residentName'
                              ? 'sticky left-0 z-10 bg-white'
                              : ''
                          } ${col.isAvg ? 'bg-slate-50/50' : ''}`}
                          style={{
                            fontSize: '12px',
                          }}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
