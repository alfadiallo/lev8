// Running the Board - Simulation Page
// Main grid view for facilitating the multi-patient simulation

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SimulationGrid from '@/components/modules/running-board/SimulationGrid';
import TimerControls from '@/components/modules/running-board/TimerControls';
import { 
  ClinicalCase, 
  RunningBoardSession,
  CheckboxState,
  getPhaseByTime,
  PhaseId,
} from '@/lib/types/running-board';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

export default function RunningBoardSimulationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<RunningBoardSession | null>(null);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [checkboxState, setCheckboxState] = useState<CheckboxState>({});
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseId>(1);
  
  // UI state
  const [darkMode, setDarkMode] = useState(false);

  // Load session data
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          const newPhase = getPhaseByTime(newTime);
          if (newPhase !== currentPhase) {
            setCurrentPhase(newPhase);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentPhase]);

  const loadSession = async () => {
    try {
      setLoading(true);
      // API routes now use cookie-based auth, no Bearer token needed
      const response = await fetch(`/api/running-board/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();
      setSession(data.session);
      setCases(data.session.cases || []);

      // Load existing actions into checkbox state
      if (data.session.actions) {
        const state: CheckboxState = {};
        for (const action of data.session.actions) {
          const key = `${action.case_id}_${action.checklist_item_id}`;
          state[key] = {
            checked: action.checked,
            checked_at: action.checked_at ? new Date(action.checked_at) : undefined,
            elapsed_time_seconds: action.elapsed_time_seconds,
          };
        }
        setCheckboxState(state);
      }
    } catch (error) {
      console.error('[Simulation] Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setIsRunning(true);
    
    // Update session status (cookies handle auth)
    fetch(`/api/running-board/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleEnd = async () => {
    setIsRunning(false);
    
    // Update session status (cookies handle auth)
    await fetch(`/api/running-board/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: 'completed',
        final_phase_reached: currentPhase,
        dark_mode_used: darkMode,
      }),
    });

    // Navigate to debrief
    router.push(`/modules/learn/running-board/simulation/${sessionId}/debrief`);
  };

  const handleJumpToPhase = (phase: PhaseId) => {
    setCurrentPhase(phase);
    // Calculate elapsed time for the start of this phase
    const phaseTimes: Record<PhaseId, number> = {
      1: 0,
      2: 120,
      3: 300,
      4: 480,
      5: 600,
      6: 720,
      7: 900,
      8: 1080,
    };
    setElapsedTime(phaseTimes[phase]);
  };

  const handleCheckboxToggle = useCallback(async (
    caseId: string, 
    itemId: string, 
    phaseId: PhaseId, 
    isCritical: boolean
  ) => {
    const key = `${caseId}_${itemId}`;
    const current = checkboxState[key];
    const newChecked = !current?.checked;

    // Update local state immediately
    setCheckboxState(prev => ({
      ...prev,
      [key]: {
        checked: newChecked,
        checked_at: newChecked ? new Date() : undefined,
        elapsed_time_seconds: newChecked ? elapsedTime : undefined,
      },
    }));

    // Save to backend (cookies handle auth)
    fetch(`/api/running-board/sessions/${sessionId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        case_id: caseId,
        checklist_item_id: itemId,
        phase_id: phaseId,
        is_critical: isCritical,
        checked: newChecked,
        elapsed_time_seconds: elapsedTime,
      }),
    });
  }, [checkboxState, elapsedTime, sessionId]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>Session not found</p>
          <button
            onClick={() => router.push('/modules/learn/running-board')}
            className="mt-4 text-sky-500 hover:text-sky-600"
          >
            Return to setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col touch-manipulation overflow-hidden ${darkMode ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      {/* Header - iPad optimized with larger touch targets */}
      <header className={`flex-none sticky top-0 z-50 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} border-b`}>
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left: Back and session info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/modules/learn/running-board')}
              className={`p-3 rounded-lg active:scale-95 transition-transform ${darkMode ? 'hover:bg-neutral-700 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-600'}`}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-neutral-800'}`}>
                Running the Board
              </h1>
              <div className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <span>Learner: {session.learner_name} (PGY-{session.learner_pgy_level})</span>
                {session.educator_name && (
                  <span className="ml-3 pl-3 border-l border-neutral-300">
                    Educator: {session.educator_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Timer Controls */}
          <TimerControls
            elapsedTime={elapsedTime}
            isRunning={isRunning}
            currentPhase={currentPhase}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onEnd={handleEnd}
            onJumpToPhase={handleJumpToPhase}
            darkMode={darkMode}
          />

          {/* Right: Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-lg active:scale-95 transition-transform ${darkMode ? 'bg-neutral-700 text-amber-400' : 'bg-neutral-100 text-neutral-600'}`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </header>

      {/* Main Grid - iPad optimized with touch scrolling */}
      <main className="flex-1 overflow-hidden">
        <SimulationGrid
          cases={cases}
          currentPhase={currentPhase}
          elapsedTime={elapsedTime}
          checkboxState={checkboxState}
          onCheckboxToggle={handleCheckboxToggle}
          darkMode={darkMode}
        />
      </main>
    </div>
  );
}
