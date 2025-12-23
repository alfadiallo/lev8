'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  ArrowLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  X,
  Check,
  Download,
  GraduationCap,
  Database,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

// ============================================================================
// TYPES
// ============================================================================

interface ExamData {
  score: number | null;
  percentile: number | null;
  year: number | null;
  id?: string;
  rank?: number | null;
}

interface ResidentScore {
  id: string;
  name: string;
  anonCode: string;
  classYear: number;
  scores: {
    usmle1: ExamData;
    usmle2: ExamData;
    comlex: ExamData;
    ite1: ExamData;
    ite2: ExamData;
    ite3: ExamData;
    board: ExamData;
  };
}

interface ClassGroup {
  graduationYear: number;
  pgyLevel: number | null;
  isGraduated: boolean;
  residents: ResidentScore[];
  averages: {
    usmle1: { score: number; percentile: number };
    usmle2: { score: number; percentile: number };
    comlex: { score: number; percentile: number };
    ite1: { score: number; percentile: number };
    ite2: { score: number; percentile: number };
    ite3: { score: number; percentile: number };
    board: { score: number; percentile: number };
  };
}

// Helper to determine if a class has graduated
function hasClassGraduated(graduationYear: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  if (graduationYear < currentYear) return true;
  if (graduationYear === currentYear && currentMonth >= 6) return true;
  return false;
}

function getPGYForClass(graduationYear: number): number | null {
  if (hasClassGraduated(graduationYear)) return null;
  return calculatePGYLevel(graduationYear);
}

function formatClassHeader(graduationYear: number, pgyLevel: number | null): string {
  if (pgyLevel === null) {
    return `Class of ${graduationYear}`;
  }
  return `Class of ${graduationYear} (PGY-${pgyLevel})`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScoresPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;
  const canEdit = userRole === 'program_director' || userRole === 'admin' || userRole === 'super_admin';
  
  const [loading, setLoading] = useState(true);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const toggleGroupCollapse = (graduationYear: number) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(graduationYear)) {
        next.delete(graduationYear);
      } else {
        next.add(graduationYear);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedGroups(new Set()); // Empty set = all expanded
  };

  const collapseAll = () => {
    setCollapsedGroups(new Set(classGroups.map(g => g.graduationYear)));
  };

  const allExpanded = collapsedGroups.size === 0;
  const toggleExpandAll = () => {
    if (allExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Try using the view first (like Residents page)
      let residentsData: any[] = [];
      
      const { data: viewData, error: viewError } = await supabaseClient
        .from('residents_with_pgy')
        .select('id, full_name, anon_code, graduation_year, class_name, current_pgy_level');
      
      if (!viewError && viewData && viewData.length > 0) {
        residentsData = viewData;
      } else {
        // Fallback: query residents directly
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('residents')
          .select(`
            id, 
            anon_code,
            user_profiles:user_id(full_name),
            classes:class_id(graduation_year)
          `);

        if (fallbackError) throw fallbackError;
        
        // Transform fallback data to match view format
        residentsData = (fallbackData || []).map((r: any) => ({
          id: r.id,
          full_name: r.user_profiles?.full_name || 'Unknown Resident',
          anon_code: r.anon_code || 'R000',
          graduation_year: r.classes?.graduation_year || 2027
        }));
      }
      
      const residents = residentsData;

      // Fetch ITE scores
      const { data: iteScores, error: iteError } = await supabaseClient
        .from('ite_scores')
        .select('*');

      if (iteError) throw iteError;

      // Fetch Exam scores (USMLE, COMLEX, Boards) - handle if table doesn't exist
      let otherScores: any[] = [];
      try {
        const { data, error } = await supabaseClient.from('exam_scores').select('*');
        if (!error && data) otherScores = data;
      } catch (e) {
        console.warn('exam_scores table might not exist yet');
      }

      // Process data into class groups
      const processedGroups: Record<number, ClassGroup> = {};

      residents?.forEach(res => {
        const classYear = res.graduation_year || 2027;
        const name = res.full_name || 'Unknown Resident';
        const anonCode = res.anon_code || 'R000';
        
        if (!processedGroups[classYear]) {
          const pgyLevel = getPGYForClass(classYear);
          processedGroups[classYear] = {
            graduationYear: classYear,
            pgyLevel,
            isGraduated: hasClassGraduated(classYear),
            residents: [],
            averages: {
              usmle1: { score: 0, percentile: 0 },
              usmle2: { score: 0, percentile: 0 },
              comlex: { score: 0, percentile: 0 },
              ite1: { score: 0, percentile: 0 },
              ite2: { score: 0, percentile: 0 },
              ite3: { score: 0, percentile: 0 },
              board: { score: 0, percentile: 0 }
            }
          };
        }

        const resIte = iteScores?.filter(s => s.resident_id === res.id) || [];
        const resOther = otherScores?.filter(s => s.resident_id === res.id) || [];

        const getIte = (pgy: number) => {
          return resIte.find((x: any) => x.pgy_level == pgy || x.pgy_level == `PGY-${pgy}` || x.pgy_level === pgy);
        };

        const getExam = (type: string) => resOther.find((x: any) => x.exam_type === type);

        const usmle1 = getExam('USMLE Step 1');
        const usmle2 = getExam('USMLE Step 2');
        const comlex = getExam('COMLEX Level 1') || getExam('COMLEX');
        const board = getExam('Board Certification');
        
        const ite1 = getIte(1);
        const ite2 = getIte(2);
        const ite3 = getIte(3);

        processedGroups[classYear].residents.push({
          id: res.id,
          name,
          anonCode,
          classYear,
          scores: {
            usmle1: { score: usmle1?.score ?? null, percentile: usmle1?.percentile ?? null, year: usmle1?.year_taken ?? null, id: usmle1?.id },
            usmle2: { score: usmle2?.score ?? null, percentile: usmle2?.percentile ?? null, year: usmle2?.year_taken ?? null, id: usmle2?.id },
            comlex: { score: comlex?.score ?? null, percentile: comlex?.percentile ?? null, year: comlex?.year_taken ?? null, id: comlex?.id },
            board: { score: board?.score ?? null, percentile: board?.percentile ?? null, year: board?.year_taken ?? null, id: board?.id },
            ite1: { score: ite1?.raw_score ?? null, percentile: ite1?.percentile ?? null, year: null, id: ite1?.id },
            ite2: { score: ite2?.raw_score ?? null, percentile: ite2?.percentile ?? null, year: null, id: ite2?.id },
            ite3: { score: ite3?.raw_score ?? null, percentile: ite3?.percentile ?? null, year: null, id: ite3?.id },
          }
        });
      });

      // Calculate averages and ranks, sort residents
      Object.values(processedGroups).forEach(group => {
        const types: (keyof ResidentScore['scores'])[] = ['usmle1', 'usmle2', 'comlex', 'ite1', 'ite2', 'ite3', 'board'];
        
        types.forEach(type => {
          const validScores = group.residents.filter(r => r.scores[type].score != null);
          
          if (validScores.length > 0) {
            const avgScore = validScores.reduce((sum, r) => sum + (r.scores[type].score || 0), 0) / validScores.length;
            const avgPct = validScores.reduce((sum, r) => sum + (r.scores[type].percentile || 0), 0) / validScores.length;
            
            group.averages[type] = {
              score: Math.round(avgScore * 10) / 10,
              percentile: Math.round(avgPct * 10) / 10
            };

            // Calculate ranks for ITEs
            if (type.startsWith('ite')) {
              const sorted = [...validScores].sort((a, b) => (b.scores[type].percentile || 0) - (a.scores[type].percentile || 0));
              let currentRank = 1;
              sorted.forEach((r, idx) => {
                if (idx > 0 && r.scores[type].percentile !== sorted[idx-1].scores[type].percentile) {
                  currentRank = idx + 1;
                }
                const orig = group.residents.find(x => x.id === r.id);
                if (orig) orig.scores[type].rank = currentRank;
              });
            }
          }
        });
        
        group.residents.sort((a, b) => a.name.localeCompare(b.name));
      });

      // Sort groups: active classes first (by PGY desc: PGY-3, PGY-2, PGY-1), then graduated (by year desc)
      const sortedGroups = Object.values(processedGroups).sort((a, b) => {
        if (a.isGraduated !== b.isGraduated) {
          return a.isGraduated ? 1 : -1;
        }
        if (!a.isGraduated) {
          // Higher PGY level first (PGY-3 before PGY-2 before PGY-1)
          return (b.pgyLevel || 0) - (a.pgyLevel || 0);
        }
        return b.graduationYear - a.graduationYear;
      });

      setClassGroups(sortedGroups);

    } catch (err) {
      console.error('Error fetching scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (resId: string, type: string, field: 'score' | 'percentile' | 'year', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [`${resId}-${type}-${field}`]: value
    }));
  };

  const getEditValue = (resId: string, type: string, field: 'score' | 'percentile' | 'year', original: any) => {
    const key = `${resId}-${type}-${field}`;
    if (key in editValues) return editValues[key];
    return original != null ? original.toString() : '';
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const changes = new Map<string, any>();

      Object.entries(editValues).forEach(([key, value]) => {
        const lastDash = key.lastIndexOf('-');
        const secondLastDash = key.lastIndexOf('-', lastDash - 1);
        
        const resId = key.substring(0, secondLastDash);
        const type = key.substring(secondLastDash + 1, lastDash);
        const field = key.substring(lastDash + 1);
        
        const compositeKey = `${resId}|${type}`;
        if (!changes.has(compositeKey)) changes.set(compositeKey, {});
        
        const numericVal = value === '' ? null : (field === 'year' ? parseInt(value) : parseFloat(value));
        changes.get(compositeKey)[field] = numericVal;
      });

      for (const [key, data] of changes.entries()) {
        const [resId, type] = key.split('|');
        
        if (type.startsWith('ite')) {
          const pgy = parseInt(type.replace('ite', ''));
          
          const { data: existing } = await supabaseClient
            .from('ite_scores')
            .select('id')
            .eq('resident_id', resId)
            .or(`pgy_level.eq.PGY-${pgy},pgy_level.eq.${pgy}`)
            .maybeSingle();
            
          if (existing) {
            const updateData: any = { updated_at: new Date().toISOString() };
            if (data.score !== undefined) updateData.raw_score = data.score;
            if (data.percentile !== undefined) updateData.percentile = data.percentile;
            
            await supabaseClient.from('ite_scores').update(updateData).eq('id', existing.id);
          } else if (data.score !== null || data.percentile !== null) {
            const resident = classGroups.flatMap(g => g.residents).find(r => r.id === resId);
            const gradYear = resident?.classYear || 2027;
            const startYear = gradYear - 3;
            const academicStart = startYear + (pgy - 1);
            
            await supabaseClient.from('ite_scores').insert({
              resident_id: resId,
              pgy_level: `PGY-${pgy}`,
              academic_year: `${academicStart}-${academicStart+1}`,
              test_date: `${academicStart+1}-02-01`,
              raw_score: data.score,
              percentile: data.percentile
            });
          }
        } else {
          let examType = '';
          switch(type) {
            case 'usmle1': examType = 'USMLE Step 1'; break;
            case 'usmle2': examType = 'USMLE Step 2'; break;
            case 'comlex': examType = 'COMLEX Level 1'; break;
            case 'board': examType = 'Board Certification'; break;
          }
          
          if (examType) {
            const { data: existing } = await supabaseClient
              .from('exam_scores')
              .select('id')
              .eq('resident_id', resId)
              .eq('exam_type', examType)
              .maybeSingle();
              
            if (existing) {
              const updateData: any = { updated_at: new Date().toISOString() };
              if (data.score !== undefined) updateData.score = data.score;
              if (data.percentile !== undefined) updateData.percentile = data.percentile;
              if (data.year !== undefined) updateData.year_taken = data.year;
              
              await supabaseClient.from('exam_scores').update(updateData).eq('id', existing.id);
            } else if (data.score !== null || data.percentile !== null) {
              await supabaseClient.from('exam_scores').insert({
                resident_id: resId,
                exam_type: examType,
                score: data.score,
                percentile: data.percentile,
                year_taken: data.year
              });
            }
          }
        }
      }

      setIsEditing(false);
      setEditValues({});
      fetchData();

    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving data');
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile: number | null): string => {
    if (percentile === null || percentile === undefined) return '';
    if (percentile >= 90) return 'bg-emerald-200 text-emerald-900';
    if (percentile >= 75) return 'bg-emerald-100 text-emerald-800';
    if (percentile >= 50) return 'bg-blue-100 text-blue-800';
    if (percentile >= 25) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const renderCell = (resident: ResidentScore, type: keyof ResidentScore['scores'], field: 'score' | 'percentile' | 'year', colorize = false) => {
    const val = resident.scores[type][field];
    const bgClass = colorize && field === 'percentile' ? getPercentileColor(val as number) : '';
    
    if (isEditing) {
      return (
        <input
          type="number"
          className="w-14 px-1 py-0.5 text-center text-xs border border-neutral-300 rounded focus:border-[#0EA5E9] focus:outline-none"
          value={getEditValue(resident.id, type, field, val)}
          onChange={(e) => handleInputChange(resident.id, type, field, e.target.value)}
          placeholder="-"
        />
      );
    }
    
    return (
      <span className={`${bgClass} ${val == null ? 'text-neutral-300' : 'text-neutral-900'} px-1 rounded`}>
        {val ?? '-'}
      </span>
    );
  };

  // Render rank with styling (gold/silver/bronze for top 3)
  const renderRank = (resident: ResidentScore, type: 'ite1' | 'ite2' | 'ite3', totalInClass: number) => {
    const rank = resident.scores[type].rank;
    if (!rank) return <span className="text-neutral-300">-</span>;
    
    let colorClass = 'text-neutral-600';
    if (rank === 1) colorClass = 'text-amber-600 font-bold'; // Gold
    else if (rank === 2) colorClass = 'text-neutral-400 font-semibold'; // Silver
    else if (rank === 3) colorClass = 'text-amber-700 font-semibold'; // Bronze
    else if (rank <= Math.ceil(totalInClass / 3)) colorClass = 'text-emerald-600'; // Top third
    else if (rank > Math.ceil(totalInClass * 2 / 3)) colorClass = 'text-red-500'; // Bottom third
    
    return <span className={colorClass}>#{rank}</span>;
  };

  // Get currently selected resident and their class
  const selectedResident = classGroups.flatMap(g => g.residents).find(r => r.id === selectedResidentId);
  const selectedClass = selectedResident 
    ? classGroups.find(g => g.graduationYear === selectedResident.classYear)
    : null;
  
  const activeResidentCount = classGroups.filter(g => !g.isGraduated).reduce((sum, g) => sum + g.residents.length, 0);
  const totalResidents = classGroups.reduce((sum, g) => sum + g.residents.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/25 backdrop-blur-sm border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Back button and title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/truths/uploads')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                <Database size={24} className="text-[#0EA5E9]" />
                Scores
              </h1>
              <p className="text-sm text-neutral-500">
                {activeResidentCount} active residents • {classGroups.length} classes
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                <Edit2 size={16} />
                Edit Scores
              </button>
            )}
            
            {isEditing && (
              <>
                <button 
                  onClick={() => { setIsEditing(false); setEditValues({}); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm"
                >
                  <Check size={16} />
                  Save Changes
                </button>
              </>
            )}
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Grouped by Class like Residents page */}
        <aside 
          className={`flex-shrink-0 bg-white/10 backdrop-blur-sm border-r border-neutral-200 transition-all duration-300 flex flex-col z-20 ${
            sidebarCollapsed ? 'w-16' : 'w-72'
          }`}
          style={{ width: sidebarCollapsed ? '4rem' : '18rem' }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Users size={18} className="text-neutral-500" />
                <span className="font-medium text-neutral-700">Residents</span>
                <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded-full">{totalResidents}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {!sidebarCollapsed && (
                <button
                  onClick={toggleExpandAll}
                  className="p-1 hover:bg-neutral-100 rounded transition-colors"
                  title={allExpanded ? 'Collapse All' : 'Expand All'}
                >
                  {allExpanded ? <ChevronsDownUp size={18} className="text-neutral-500" /> : <ChevronsUpDown size={18} className="text-neutral-500" />}
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>

          {/* Grouped Resident List */}
          <div className="flex-1 overflow-y-auto">
            {classGroups.map((group, groupIndex) => {
              const isCollapsed = collapsedGroups.has(group.graduationYear);
              const isFirstGraduated = group.isGraduated && 
                (groupIndex === 0 || !classGroups[groupIndex - 1].isGraduated);
              
              return (
                <div key={group.graduationYear}>
                  {/* Separator before graduated classes */}
                  {isFirstGraduated && !sidebarCollapsed && (
                    <div className="px-4 py-2 bg-neutral-200/50 border-y border-neutral-300">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <GraduationCap size={14} />
                        <span className="font-medium uppercase tracking-wide">Graduated</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Class Group Header */}
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => toggleGroupCollapse(group.graduationYear)}
                      className={`w-full sticky top-0 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between hover:bg-neutral-200/50 transition-colors ${
                        group.isGraduated ? 'bg-neutral-50' : 'bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight size={16} className="text-neutral-400" />
                        ) : (
                          <ChevronDown size={16} className="text-neutral-400" />
                        )}
                        <span className={`text-sm font-semibold ${group.isGraduated ? 'text-neutral-500' : 'text-neutral-700'}`}>
                          {formatClassHeader(group.graduationYear, group.pgyLevel)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        group.isGraduated 
                          ? 'bg-neutral-200 text-neutral-500' 
                          : 'bg-white text-neutral-600'
                      }`}>
                        {group.residents.length}
                      </span>
                    </button>
                  )}
                  
                  {/* Residents in this group (collapsible) */}
                  {!isCollapsed && group.residents.map((resident) => {
                    const isSelected = resident.id === selectedResidentId;
                    
                    return (
                      <button
                        key={resident.id}
                        onClick={() => setSelectedResidentId(resident.id)}
                        className={`w-full text-left p-4 border-b border-neutral-100 transition-colors outline-none focus:outline-none ring-0 focus:ring-0 ${
                          isSelected ? '' : 'hover:bg-neutral-50'
                        } ${group.isGraduated ? 'opacity-75' : ''}`}
                        style={{
                          backgroundColor: isSelected ? '#E0F2FE' : undefined,
                          border: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {sidebarCollapsed ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-neutral-600">
                              {resident.anonCode.slice(-2)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className={`font-medium truncate ${isSelected ? 'text-neutral-900' : 'text-neutral-800'}`}>
                                {resident.name}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                {resident.anonCode}
                              </p>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content - Score Table */}
        <main className="flex-1 overflow-auto bg-white/50 p-6">
          {allExpanded ? (
            // Show ALL classes in one consolidated table with rotated class labels
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-800">All Residents</h2>
                <p className="text-sm text-neutral-500">{totalResidents} residents • {classGroups.length} classes</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 font-semibold">
                      <th className="w-8 bg-neutral-50 border-r border-neutral-200"></th>
                      <th className="px-4 py-3 text-left w-44 sticky left-8 bg-neutral-50 border-r border-neutral-200 z-10">Resident</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-blue-50/30" colSpan={3}>USMLE Step 1</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-indigo-50/30" colSpan={3}>USMLE Step 2</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-purple-50/30" colSpan={3}>COMLEX</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-amber-50/30" colSpan={3}>ITE PGY 1</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-orange-50/30" colSpan={3}>ITE PGY 2</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-red-50/30" colSpan={3}>ITE PGY 3</th>
                      <th className="px-2 py-2 text-center bg-emerald-50/30" colSpan={2}>Board Score</th>
                    </tr>
                    <tr className="border-b border-neutral-200 text-xs text-neutral-500 font-medium">
                      <th className="bg-white border-r border-neutral-200"></th>
                      <th className="px-4 py-2 text-left sticky left-8 bg-white border-r border-neutral-200 z-10"></th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classGroups.map((group, groupIndex) => {
                      const isFirstGraduated = group.isGraduated && 
                        (groupIndex === 0 || !classGroups[groupIndex - 1].isGraduated);
                      
                      // Color for class label based on PGY level or graduated
                      const classColor = group.isGraduated 
                        ? 'bg-neutral-100 text-neutral-500'
                        : group.pgyLevel === 3 ? 'bg-sky-100 text-sky-700'
                        : group.pgyLevel === 2 ? 'bg-indigo-100 text-indigo-700'
                        : group.pgyLevel === 1 ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-600';
                      
                      return (
                        <React.Fragment key={group.graduationYear}>
                          {/* Graduated separator row */}
                          {isFirstGraduated && (
                            <tr className="bg-neutral-200">
                              <td colSpan={23} className="py-2 px-4">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <GraduationCap size={14} />
                                  <span className="font-medium uppercase tracking-wide">Graduated Classes</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          
                          {group.residents.map((resident, residentIndex) => {
                            const isHighlighted = resident.id === selectedResidentId;
                            const isFirstInGroup = residentIndex === 0;
                            const isLastInGroup = residentIndex === group.residents.length - 1;
                            
                            return (
                              <tr 
                                key={resident.id} 
                                className={`group transition-colors ${isHighlighted ? 'bg-sky-50' : 'hover:bg-neutral-50/50'} ${isLastInGroup ? 'border-b-2 border-neutral-300' : 'border-b border-neutral-100'}`}
                              >
                                {/* Rotated class label - only on first row of group */}
                                {isFirstInGroup && (
                                  <td 
                                    rowSpan={group.residents.length}
                                    className={`${classColor} border-r border-neutral-200 relative`}
                                    style={{ width: '32px', minWidth: '32px' }}
                                  >
                                    <div 
                                      className="absolute inset-0 flex items-center justify-center"
                                      style={{ 
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        transform: 'rotate(180deg)',
                                      }}
                                    >
                                      <span className="text-xs font-bold whitespace-nowrap px-1">
                                        {group.pgyLevel ? `PGY-${group.pgyLevel}` : group.graduationYear}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                
                                <td className={`px-4 py-2 font-medium text-neutral-900 border-r border-neutral-200 sticky left-8 z-10 text-sm ${isHighlighted ? 'bg-sky-50' : 'bg-white group-hover:bg-neutral-50'}`}>
                                  {resident.name}
                                </td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle1', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle1', 'year')}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'usmle1', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle2', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle2', 'year')}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'usmle2', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'comlex', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'comlex', 'year')}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'comlex', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite1', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite1', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite1', group.residents.length)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite2', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite2', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite2', group.residents.length)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite3', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite3', 'percentile', true)}</td>
                                <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite3', group.residents.length)}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'board', 'score')}</td>
                                <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'board', 'percentile', true)}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selectedClass ? (
            // Show single selected class
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-800">
                  {formatClassHeader(selectedClass.graduationYear, selectedClass.pgyLevel)}
                </h2>
                <p className="text-sm text-neutral-500">{selectedClass.residents.length} residents</p>
              </div>
              
              {/* Score Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 font-semibold">
                      <th className="px-4 py-3 text-left w-48 sticky left-0 bg-neutral-50 border-r border-neutral-200 z-10">Resident</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-blue-50/30" colSpan={3}>USMLE Step 1</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-indigo-50/30" colSpan={3}>USMLE Step 2</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-purple-50/30" colSpan={3}>COMLEX</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-amber-50/30" colSpan={3}>ITE PGY 1</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-orange-50/30" colSpan={3}>ITE PGY 2</th>
                      <th className="px-2 py-2 text-center border-r border-neutral-200 bg-red-50/30" colSpan={3}>ITE PGY 3</th>
                      <th className="px-2 py-2 text-center bg-emerald-50/30" colSpan={2}>Board Score</th>
                    </tr>
                    <tr className="border-b border-neutral-200 text-xs text-neutral-500 font-medium">
                      <th className="px-4 py-2 text-left sticky left-0 bg-white border-r border-neutral-200 z-10"></th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">Year</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">%</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                      <th className="px-1 py-2 text-center w-12 border-r border-neutral-200">Rank</th>
                      <th className="px-1 py-2 text-center w-12">Score</th>
                      <th className="px-1 py-2 text-center w-12">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedClass.residents.map(resident => {
                      const isHighlighted = resident.id === selectedResidentId;
                      return (
                        <tr 
                          key={resident.id} 
                          className={`group transition-colors ${isHighlighted ? 'bg-sky-50' : 'hover:bg-neutral-50/50'}`}
                        >
                          <td className={`px-4 py-2 font-medium text-neutral-900 border-r border-neutral-200 sticky left-0 z-10 text-sm ${isHighlighted ? 'bg-sky-50' : 'bg-white group-hover:bg-neutral-50'}`}>
                            {resident.name}
                          </td>
                          
                          {/* USMLE 1 */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle1', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle1', 'year')}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'usmle1', 'percentile', true)}</td>
                          
                          {/* USMLE 2 */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle2', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'usmle2', 'year')}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'usmle2', 'percentile', true)}</td>
                          
                          {/* COMLEX */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'comlex', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'comlex', 'year')}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderCell(resident, 'comlex', 'percentile', true)}</td>
                          
                          {/* ITE 1 */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite1', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite1', 'percentile', true)}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite1', selectedClass.residents.length)}</td>
                          
                          {/* ITE 2 */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite2', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite2', 'percentile', true)}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite2', selectedClass.residents.length)}</td>
                          
                          {/* ITE 3 */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite3', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'ite3', 'percentile', true)}</td>
                          <td className="px-1 py-2 text-center text-xs border-r border-neutral-200">{renderRank(resident, 'ite3', selectedClass.residents.length)}</td>
                          
                          {/* Board */}
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'board', 'score')}</td>
                          <td className="px-1 py-2 text-center text-xs">{renderCell(resident, 'board', 'percentile', true)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              <div className="text-center">
                <Database size={48} className="mx-auto text-neutral-300 mb-4" />
                <p>Select a resident from the sidebar to view their class scores</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
