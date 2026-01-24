'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Target,
  Brain,
  Stethoscope,
  Activity,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertCircle,
  UserCircle,
  GraduationCap
} from 'lucide-react';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';
import ITEAnalyticsPane from '@/components/analytics/ite/ITEAnalyticsPane';
import { useAuth } from '@/context/AuthContext';

// ... existing imports ...
import SWOTTab from '@/components/analytics/SWOTTab';
import ScoresTab from '@/components/analytics/ScoresTab';
import { SWOTSummary, PeriodScore, ITEScore } from '@/lib/types/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface ResidentWithPGY {
  id: string;
  full_name: string;
  anon_code: string;
  graduation_year: number;
  class_name: string;
  current_pgy_level: number;
}

interface ResidentNote {
  id: string;
  resident_id: string;
  source_type: string;
  note_type: string;
  note_text: string;
  created_by: string;
  created_at: string;
}

// Pane definitions - reordered for workflow
const PANES = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'ite', label: 'ITE Scores', icon: AlertCircle },
  { id: 'eq-pq-iq', label: 'EQ/PQ/IQ', icon: Brain },
  { id: 'swot', label: 'SWOT', icon: Target },
  { id: 'rosh', label: 'ROSH', icon: BookOpen },
  { id: 'procedures', label: 'Procedures', icon: Stethoscope },
  { id: 'ultrasound', label: 'Ultrasound', icon: Activity },
  { id: 'csi', label: 'CSI', icon: BarChart3 },
  { id: 'milestones', label: 'Milestones', icon: CheckCircle },
] as const;

type PaneId = typeof PANES[number]['id'];

// Group residents by graduation year (class)
interface ClassGroup {
  graduationYear: number;
  pgyLevel: number | null; // null for graduated classes
  isGraduated: boolean;
  residents: ResidentWithPGY[];
}

// Helper to determine if a class has graduated
// Academic year ends in June, so if we're past June of their graduation year, they've graduated
function hasClassGraduated(graduationYear: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  
  // If graduation year is in the past, definitely graduated
  if (graduationYear < currentYear) return true;
  
  // If graduation year is current year and we're past June, graduated
  if (graduationYear === currentYear && currentMonth >= 6) return true;
  
  return false;
}

// Calculate PGY level for a class (returns null if graduated)
function getPGYForClass(graduationYear: number): number | null {
  if (hasClassGraduated(graduationYear)) return null;
  return calculatePGYLevel(graduationYear);
}

// Format class header text
function formatClassHeader(graduationYear: number, pgyLevel: number | null): string {
  if (pgyLevel === null) {
    return `Class of ${graduationYear}`;
  }
  return `Class of ${graduationYear} (PGY-${pgyLevel})`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResidentsPortalPage() {
  const router = useRouter();
  const _auth = useAuth();
  
  // Data state
  const [residents, setResidents] = useState<ResidentWithPGY[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [notes, setNotes] = useState<ResidentNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [currentPane, setCurrentPane] = useState<PaneId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set()); // graduation years that are collapsed
  
  // Timer state
  const [sessionTimer, setSessionTimer] = useState(0);
  const [residentTimer, setResidentTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Toggle group collapse
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

  // Fetch residents data
  useEffect(() => {
    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
        setResidentTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fetch notes when resident changes
  useEffect(() => {
    if (selectedResidentId) {
      fetchNotes(selectedResidentId);
    }
  }, [selectedResidentId]);

  const fetchResidents = async () => {
    try {
      // Use API route instead of direct Supabase query
      const response = await fetch('/api/residents');
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch residents');
      }

      const { residents: residentData } = await response.json();

      if (residentData && residentData.length > 0) {
        setResidents(residentData as ResidentWithPGY[]);
        
        // Group by graduation year (class)
        const grouped = groupResidentsByClass(residentData as ResidentWithPGY[]);
        setClassGroups(grouped);
        
        // Auto-select first resident from first current class
        const firstCurrentClass = grouped.find(g => !g.isGraduated);
        if (firstCurrentClass && firstCurrentClass.residents.length > 0) {
          setSelectedResidentId(firstCurrentClass.residents[0].id);
        } else if (grouped.length > 0 && grouped[0].residents.length > 0) {
          setSelectedResidentId(grouped[0].residents[0].id);
        }
        
        // Collapse graduated classes by default
        const graduatedYears = grouped.filter(g => g.isGraduated).map(g => g.graduationYear);
        setCollapsedGroups(new Set(graduatedYears));
        
        console.log('[Residents] Loaded:', residentData.length, 'residents in', grouped.length, 'classes');
      }
    } catch (err) {
      console.error('[Residents] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (residentId: string) => {
    try {
      const response = await fetch(`/api/resident-notes?resident_id=${residentId}&source_type=portal_review`);
      const data = await response.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error('[Residents] Error fetching notes:', err);
    }
  };

  const groupResidentsByClass = (residents: ResidentWithPGY[]): ClassGroup[] => {
    const groups: Map<number, ResidentWithPGY[]> = new Map();
    
    for (const resident of residents) {
      const year = resident.graduation_year;
      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year)!.push(resident);
    }
    
    // Convert to array with metadata
    const classGroups: ClassGroup[] = Array.from(groups.entries()).map(([graduationYear, residents]) => ({
      graduationYear,
      pgyLevel: getPGYForClass(graduationYear),
      isGraduated: hasClassGraduated(graduationYear),
      residents: residents.sort((a, b) => a.full_name.localeCompare(b.full_name))
    }));
    
    // Sort: Current classes first (by PGY descending: PGY-3, PGY-2, PGY-1), then graduated (by year descending)
    const currentClasses = classGroups
      .filter(g => !g.isGraduated)
      .sort((a, b) => (b.pgyLevel || 0) - (a.pgyLevel || 0));
    
    const graduatedClasses = classGroups
      .filter(g => g.isGraduated)
      .sort((a, b) => b.graduationYear - a.graduationYear);
    
    return [...currentClasses, ...graduatedClasses];
  };

  // Timer controls
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const nextResident = useCallback(() => {
    // Find current resident across all groups
    let foundCurrent = false;
    for (const group of classGroups) {
      // Skip collapsed groups when navigating
      if (collapsedGroups.has(group.graduationYear)) continue;
      
      for (let i = 0; i < group.residents.length; i++) {
        if (foundCurrent) {
          setSelectedResidentId(group.residents[i].id);
          setResidentTimer(0);
          return;
        }
        if (group.residents[i].id === selectedResidentId) {
          foundCurrent = true;
          // Check if there's a next in this group
          if (i < group.residents.length - 1) {
            setSelectedResidentId(group.residents[i + 1].id);
            setResidentTimer(0);
            return;
          }
        }
      }
    }
  }, [classGroups, collapsedGroups, selectedResidentId]);

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current resident
  const currentResident = residents.find(r => r.id === selectedResidentId);

  // Memoize pane content to prevent re-renders on timer tick
  const memoizedPaneContent = useMemo(() => {
    if (!selectedResidentId || !currentResident) return null;
    return (
      <PaneContent
        paneId={currentPane}
        resident={currentResident}
        notes={notes}
      />
    );
  }, [selectedResidentId, currentResident, currentPane, notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  if (residents.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={48} className="mx-auto text-neutral-300 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-700">No Residents Found</h2>
        <p className="text-neutral-500 mt-2">There are no active residents in the system.</p>
        <button
          onClick={() => router.push('/modules/understand')}
          className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg"
        >
          Back to Show
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with Timers */}
      <div className="flex-shrink-0 bg-white/25 backdrop-blur-sm border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Back button and title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/modules/understand')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                <UserCircle size={24} className="text-[#4A90A8]" />
                Residents
              </h1>
              <p className="text-sm text-neutral-500">
                {classGroups.filter(g => !g.isGraduated).reduce((sum, g) => sum + g.residents.length, 0)} active residents • {classGroups.length} classes
              </p>
            </div>
          </div>

          {/* Timers */}
          <div className="flex items-center gap-6">
            {/* Session Timer */}
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Session</p>
              <p className="text-2xl font-mono font-bold text-neutral-800">{formatTime(sessionTimer)}</p>
            </div>

            {/* Resident Timer */}
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wide truncate max-w-[120px]">
                {currentResident?.full_name || 'Resident'}
              </p>
              <p className="text-2xl font-mono font-bold text-[#0EA5E9]">
                {formatTime(residentTimer)}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTimer}
                className={`p-3 rounded-full transition-colors ${
                  isTimerRunning
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={nextResident}
                className="p-3 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0284C7] transition-colors"
                title="Next Resident"
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Resident List Grouped by PGY */}
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
                <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded-full">{residents.length}</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
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
                        onClick={() => {
                          setSelectedResidentId(resident.id);
                          setResidentTimer(0);
                        }}
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
                              {resident.anon_code.slice(-2)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className={`font-medium truncate ${isSelected ? 'text-neutral-900' : 'text-neutral-800'}`}>
                                {resident.full_name}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                {resident.anon_code}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/5">
          {/* Pane Navigation */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm border-b border-neutral-200 px-4 z-10">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {PANES.map((pane) => {
                const Icon = pane.icon;
                const isActive = currentPane === pane.id;
                return (
                  <button
                    key={pane.id}
                    onClick={() => setCurrentPane(pane.id)}
                    className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? 'text-neutral-900 font-bold border-b-2 border-[#0EA5E9] bg-white/50 rounded-t-lg'
                        : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30 rounded-lg'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#0EA5E9]' : ''} />
                    <span className="text-sm">{pane.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pane Content */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {memoizedPaneContent ? (
              memoizedPaneContent
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <Users size={48} className="text-neutral-300 mb-4" />
                <p className="text-lg font-medium">Select a resident to begin</p>
                <p className="text-sm">Choose a resident from the sidebar list</p>
              </div>
            )}
          </div>

          {/* Notes Footer */}
          <ResidentNotesFooter
            residentId={selectedResidentId}
            onNoteAdded={() => selectedResidentId && fetchNotes(selectedResidentId)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANE CONTENT COMPONENT
// ============================================================================

interface PaneContentProps {
  paneId: PaneId;
  resident: ResidentWithPGY;
  notes: ResidentNote[];
}

function PaneContent({ paneId, resident, notes: _notes }: PaneContentProps) {
  const _pgyLevel = resident.current_pgy_level;

  const paneContent: Record<PaneId, React.ReactNode> = {
    overview: (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Under Construction</h3>
        <p className="text-gray-500 max-w-md">
          The Overview dashboard is being redesigned. Please use the other tabs to view resident data.
        </p>
      </div>
    ),
    swot: (
      <SWOTPane 
        residentId={resident.id}
        classYear={resident.graduation_year}
      />
    ),
    'eq-pq-iq': (
      <ScoresPane 
        residentId={resident.id}
      />
    ),
    rosh: <PlaceholderPane title="ROSH Review" description="ROSH Review question completion and performance" />,
    procedures: <PlaceholderPane title="Procedures" description="Procedure logs and competency tracking" />,
    ultrasound: <PlaceholderPane title="Ultrasound" description="Ultrasound procedure logs and certifications" />,
    csi: <PlaceholderPane title="Clinical Shift Indicators" description="Clinical shift performance metrics" />,
    milestones: <PlaceholderPane title="ACGME Milestones" description="Milestone achievement tracking" />,
    ite: (
      <ITEAnalyticsPane 
        residentId={resident.id}
      />
    ),
  };

  return paneContent[paneId] || <div>Unknown pane</div>;
}

// ============================================================================
// SWOT PANE WRAPPER
// ============================================================================

interface SWOTPaneProps {
  residentId: string;
  classYear: number;
}

function SWOTPane({ residentId, classYear }: SWOTPaneProps) {
  const [swotData, setSwotData] = useState<SWOTSummary[]>([]);
  const [scoresData, setScoresData] = useState<PeriodScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch SWOT data
        const swotResponse = await fetch(`/api/analytics/swot/resident/${residentId}`);
        if (swotResponse.ok) {
          const swotJson = await swotResponse.json();
          setSwotData(swotJson.periods || []);
        }

        // Fetch scores data (for AI attribute timeline)
        const scoresResponse = await fetch(`/api/analytics/scores/resident/${residentId}`);
        if (scoresResponse.ok) {
          const scoresJson = await scoresResponse.json();
          setScoresData(scoresJson.periods || []);
        }
      } catch (error) {
        console.error('[SWOTPane] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [residentId]);

  return (
    <SWOTTab
      swotData={swotData}
      scoresData={scoresData}
      loading={loading}
      residentId={residentId}
      classYear={classYear}
    />
  );
}

// ============================================================================
// SCORES PANE WRAPPER (EQ/PQ/IQ)
// ============================================================================

interface ScoresPaneProps {
  residentId: string;
}

function ScoresPane({ residentId }: ScoresPaneProps) {
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [iteScores, setIteScores] = useState<ITEScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/scores/resident/${residentId}`);
        if (response.ok) {
          const json = await response.json();
          setPeriodScores(json.periods || []);
          setIteScores(json.ite_scores || []);
        }
      } catch (error) {
        console.error('[ScoresPane] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [residentId]);

  return (
    <ScoresTab
      periodScores={periodScores}
      iteScores={iteScores}
      loading={loading}
    />
  );
}

// ============================================================================
// PLACEHOLDER PANE
// ============================================================================

function PlaceholderPane({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white/60 rounded-xl border-2 border-dashed border-neutral-300">
      <h3 className="text-xl font-semibold text-neutral-700">{title}</h3>
      <p className="text-neutral-500 mt-2">{description}</p>
      <p className="text-sm text-neutral-400 mt-4">Coming soon...</p>
    </div>
  );
}

// ============================================================================
// RESIDENT NOTES FOOTER COMPONENT
// ============================================================================

interface ResidentNotesFooterProps {
  residentId: string | null;
  onNoteAdded: () => void;
}

const NOTE_TYPES = [
  { value: 'general', label: 'General', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'strength', label: 'Strength', color: 'bg-green-100 text-green-700' },
  { value: 'weakness', label: 'Weakness', color: 'bg-red-100 text-red-700' },
  { value: 'opportunity', label: 'Opportunity', color: 'bg-blue-100 text-blue-700' },
  { value: 'threat', label: 'Threat', color: 'bg-amber-100 text-amber-700' },
  { value: 'action_item', label: 'Action Item', color: 'bg-purple-100 text-purple-700' },
  { value: 'milestone_note', label: 'Milestone', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'committee_decision', label: 'Committee', color: 'bg-indigo-100 text-indigo-700' },
];

function ResidentNotesFooter({ residentId, onNoteAdded }: ResidentNotesFooterProps) {
  const { user } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<string>('general');
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const selectedType = NOTE_TYPES.find(t => t.value === noteType) || NOTE_TYPES[0];

  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position above the button
      setDropdownPos({
        top: rect.top - 280, // Height of dropdown + padding
        left: rect.left
      });
      
      // Close on scroll or resize
      const handleScroll = () => setDropdownOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [dropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !residentId) return;

    setSaving(true);
    try {
      // API route handles auth via cookies
      const response = await fetch('/api/resident-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: residentId,
          source_type: 'portal_review',
          note_type: noteType,
          note_text: noteText.trim(),
          created_by: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      setNoteText('');
      onNoteAdded();
    } catch (err) {
      console.error('[Residents] Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-shrink-0 bg-white/25 backdrop-blur-sm border-t border-neutral-200 p-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        {/* Custom Dropdown Trigger */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedType.color} hover:opacity-90 whitespace-nowrap min-w-[120px]`}
        >
          <span>{selectedType.label}</span>
          <ChevronDown size={14} className={`ml-auto transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Portal Dropdown Menu */}
        {dropdownOpen && createPortal(
          <>
            <div 
              className="fixed inset-0 z-[9999]" 
              onClick={() => setDropdownOpen(false)} 
            />
            <div 
              className="fixed z-[10000] bg-white rounded-xl shadow-xl border border-neutral-200 py-2 w-48 animate-in fade-in zoom-in-95 duration-100"
              style={{
                top: Math.max(10, dropdownPos.top), // Ensure it doesn't go off-screen top
                left: dropdownPos.left,
              }}
            >
              {NOTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setNoteType(type.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-sky-50 transition-colors flex items-center gap-2 ${
                    noteType === type.value ? 'bg-sky-50' : ''
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${type.color.split(' ')[0]}`} />
                  <span className="text-neutral-700 font-medium">{type.label}</span>
                  {noteType === type.value && (
                    <CheckCircle size={14} className="ml-auto text-sky-500" />
                  )}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
        
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note to this resident's profile..."
          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
          disabled={!residentId}
        />
        
        <button
          type="submit"
          disabled={saving || !noteText.trim() || !residentId}
          className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </form>
    </div>
  );
}

