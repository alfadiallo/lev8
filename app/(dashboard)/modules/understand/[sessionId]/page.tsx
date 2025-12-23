'use client';

import { useState, useEffect, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  Target,
  Brain,
  Stethoscope,
  Activity,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { calculatePGYLevel, formatPGYLevel } from '@/lib/utils/pgy-calculator';

// ============================================================================
// TYPES
// ============================================================================

interface CCCSession {
  id: string;
  session_date: string;
  academic_year: string;
  session_type: string;
  title: string | null;
  pgy_level: number | null;
  duration_minutes: number;
  status: string;
  started_at: string | null;
  ended_at: string | null;
}

interface SessionResident {
  id: string;
  resident_id: string;
  discussion_order: number;
  time_allocated: number;
  time_spent: number | null;
  status: string;
  full_name: string;
  anon_code: string;
  graduation_year: number;
}

interface CCCNote {
  id: string;
  resident_id: string | null;
  note_type: string;
  note_text: string;
  created_by: string;
  created_at: string;
}

// Pane definitions
const PANES = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'swot', label: 'SWOT', icon: Target },
  { id: 'eq-pq-iq', label: 'EQ/PQ/IQ', icon: Brain },
  { id: 'rosh', label: 'ROSH', icon: BookOpen },
  { id: 'procedures', label: 'Procedures', icon: Stethoscope },
  { id: 'ultrasound', label: 'Ultrasound', icon: Activity },
  { id: 'csi', label: 'CSI', icon: BarChart3 },
  { id: 'milestones', label: 'Milestones', icon: CheckCircle },
  { id: 'ite', label: 'ITE Scores', icon: AlertCircle },
] as const;

type PaneId = typeof PANES[number]['id'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CCCSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();
  
  // Session state
  const [session, setSession] = useState<CCCSession | null>(null);
  const [residents, setResidents] = useState<SessionResident[]>([]);
  const [notes, setNotes] = useState<CCCNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [currentPane, setCurrentPane] = useState<PaneId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Timer state
  const [sessionTimer, setSessionTimer] = useState(0); // seconds elapsed
  const [residentTimer, setResidentTimer] = useState(0); // seconds elapsed for current resident
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Fetch session data
  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

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

  const fetchSessionData = async () => {
    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('ccc_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch residents in this session
      const { data: sessionResidents, error: residentError } = await supabaseClient
        .from('ccc_session_residents')
        .select('id, resident_id, discussion_order, time_allocated, time_spent, status')
        .eq('session_id', sessionId)
        .order('discussion_order', { ascending: true });

      if (residentError) {
        console.error('[CCC] Error fetching residents:', residentError);
      } else if (sessionResidents && sessionResidents.length > 0) {
        // Fetch resident details using the VIEW which already joins everything
        const residentIds = sessionResidents.map(r => r.resident_id);
        
        const { data: residentDetails, error: detailsError } = await supabaseClient
          .from('residents_with_pgy')
          .select('id, full_name, anon_code, graduation_year')
          .in('id', residentIds);

        if (detailsError) console.error('Error fetching resident details:', detailsError);

        // Map everything together
        const mappedResidents: SessionResident[] = sessionResidents.map(r => {
          const details = residentDetails?.find(d => d.id === r.resident_id);
          
          return {
            id: r.id,
            resident_id: r.resident_id,
            discussion_order: r.discussion_order,
            time_allocated: r.time_allocated,
            time_spent: r.time_spent,
            status: r.status,
            full_name: details?.full_name || 'Unknown Resident',
            anon_code: details?.anon_code || '',
            graduation_year: details?.graduation_year || 0,
          };
        });

        setResidents(mappedResidents);
        
        if (mappedResidents.length > 0 && !selectedResidentId) {
          setSelectedResidentId(mappedResidents[0].resident_id);
        }
      }

      // Fetch notes
      const { data: noteData } = await supabaseClient
        .from('ccc_notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (noteData) {
        setNotes(noteData);
      }
    } catch (err) {
      console.error('[CCC] Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer controls
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetResidentTimer = () => setResidentTimer(0);
  
  const nextResident = useCallback(() => {
    const currentIndex = residents.findIndex(r => r.resident_id === selectedResidentId);
    if (currentIndex < residents.length - 1) {
      setSelectedResidentId(residents[currentIndex + 1].resident_id);
      setResidentTimer(0);
    }
  }, [residents, selectedResidentId]);

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
  const currentResident = residents.find(r => r.resident_id === selectedResidentId);

  const memoizedPaneContent = useMemo(() => {
    if (!selectedResidentId) return null;
    
    return (
      <PaneContent
        paneId={currentPane}
        resident={currentResident || null}
        sessionDate={session ? new Date(session.session_date) : new Date()}
        notes={notes.filter(n => n.resident_id === selectedResidentId)}
      />
    );
  }, [selectedResidentId, currentResident, currentPane, session, notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-700">Session not found</h2>
        <button
          onClick={() => router.push('/modules/understand')}
          className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with Timers */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-neutral-200 px-6 py-4">
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
              <h1 className="text-xl font-bold text-neutral-800">
                {session.title || `${session.session_type} CCC ${session.academic_year}`}
              </h1>
              <p className="text-sm text-neutral-500">
                {new Date(session.session_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {session.pgy_level && ` • ${formatPGYLevel(session.pgy_level)}`}
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
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                {currentResident?.full_name || 'Resident'}
              </p>
              <p className={`text-2xl font-mono font-bold ${
                currentResident && residentTimer > (currentResident.time_allocated * 60)
                  ? 'text-red-500'
                  : 'text-[#0EA5E9]'
              }`}>
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
        {/* Sidebar - Resident List */}
        <aside 
          className={`flex-shrink-0 bg-white/60 backdrop-blur-sm border-r border-neutral-200 transition-all duration-300 flex flex-col z-20 ${
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

          {/* Resident List */}
          <div className="flex-1 overflow-y-auto">
            {residents.map((resident, index) => {
              const isSelected = resident.resident_id === selectedResidentId;
              const pgyLevel = calculatePGYLevel(resident.graduation_year, new Date(session.session_date));
              
              return (
                <button
                  key={resident.id}
                  onClick={() => {
                    setSelectedResidentId(resident.resident_id);
                    setResidentTimer(0);
                  }}
                  className={`w-full text-left p-4 border-b border-neutral-100 transition-colors outline-none focus:outline-none ring-0 focus:ring-0 ${
                    isSelected ? '' : 'hover:bg-neutral-50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#E0F2FE' : undefined,
                    border: 'none',
                    boxShadow: 'none',
                  }}
                >
                  {sidebarCollapsed ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-neutral-600">{index + 1}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0"> {/* Allow text truncation */}
                        <p className={`font-medium truncate ${isSelected ? 'text-neutral-900' : 'text-neutral-800'}`}>
                          {resident.full_name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          {resident.anon_code} • {formatPGYLevel(pgyLevel)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          resident.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : resident.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {resident.time_allocated}m
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/30">
          {/* Pane Navigation */}
          <div className="flex-shrink-0 bg-white/60 backdrop-blur-sm border-b border-neutral-200 px-4 z-10">
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
          <NotesFooter
            sessionId={sessionId}
            residentId={selectedResidentId}
            onNoteAdded={fetchSessionData}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANE CONTENT COMPONENT
// ============================================================================

import OverviewPane from '@/components/modules/understand/OverviewPane';

interface PaneContentProps {
  paneId: PaneId;
  resident: SessionResident | null;
  sessionDate: Date;
  notes: CCCNote[];
}

function PaneContent({ paneId, resident, sessionDate, notes }: PaneContentProps) {
  if (!resident) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Select a resident from the sidebar
      </div>
    );
  }

  const pgyLevel = calculatePGYLevel(resident.graduation_year, sessionDate);

  // Placeholder content for each pane
  const paneContent: Record<PaneId, React.ReactNode> = {
    overview: (
      <OverviewPane 
        residentId={resident.resident_id}
        residentName={resident.full_name}
        anonCode={resident.anon_code}
        pgyLevel={pgyLevel}
      />
    ),
    swot: <PlaceholderPane title="SWOT Analysis" description="Strengths, Weaknesses, Opportunities, and Threats" />,
    'eq-pq-iq': <PlaceholderPane title="EQ/PQ/IQ Assessment" description="Emotional, Physical, and Intellectual Quotient scores" />,
    rosh: <PlaceholderPane title="ROSH Review" description="ROSH Review question completion and performance" />,
    procedures: <PlaceholderPane title="Procedures" description="Procedure logs and competency tracking" />,
    ultrasound: <PlaceholderPane title="Ultrasound" description="Ultrasound procedure logs and certifications" />,
    csi: <PlaceholderPane title="Clinical Shift Indicators" description="Clinical shift performance metrics" />,
    milestones: <PlaceholderPane title="ACGME Milestones" description="Milestone achievement tracking" />,
    ite: <PlaceholderPane title="ITE Scores" description="In-Training Examination scores and trends" />,
  };

  return paneContent[paneId] || <div>Unknown pane</div>;
}

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
// NOTES FOOTER COMPONENT
// ============================================================================

interface NotesFooterProps {
  sessionId: string;
  residentId: string | null;
  onNoteAdded: () => void;
}

function NotesFooter({ sessionId, residentId, onNoteAdded }: NotesFooterProps) {
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<string>('general');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSaving(true);
    try {
      const { data: user } = await supabaseClient.auth.getUser();
      
      const { error } = await supabaseClient
        .from('ccc_notes')
        .insert({
          session_id: sessionId,
          resident_id: residentId,
          note_type: noteType,
          note_text: noteText.trim(),
          created_by: user?.user?.id,
        });

      if (error) throw error;
      
      setNoteText('');
      onNoteAdded();
    } catch (err) {
      console.error('[CCC] Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-neutral-200 p-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
        >
          <option value="general">General</option>
          <option value="strength">Strength</option>
          <option value="weakness">Weakness</option>
          <option value="opportunity">Opportunity</option>
          <option value="threat">Threat</option>
          <option value="action_item">Action Item</option>
          <option value="milestone_note">Milestone Note</option>
          <option value="committee_decision">Committee Decision</option>
        </select>
        
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
        />
        
        <button
          type="submit"
          disabled={saving || !noteText.trim()}
          className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </form>
    </div>
  );
}

