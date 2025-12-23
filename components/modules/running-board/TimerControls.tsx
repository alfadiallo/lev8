// TimerControls - Timer bar with play/pause and end session

'use client';

import { useState } from 'react';
import { 
  PhaseId, 
  formatElapsedTime 
} from '@/lib/types/running-board';
import { 
  Play, 
  Pause, 
  Square, 
} from 'lucide-react';

interface TimerControlsProps {
  elapsedTime: number;
  isRunning: boolean;
  currentPhase: PhaseId;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onJumpToPhase: (phase: PhaseId) => void;
  darkMode: boolean;
}

export default function TimerControls({
  elapsedTime,
  isRunning,
  onStart,
  onPause,
  onResume,
  onEnd,
  darkMode,
}: TimerControlsProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const hasStarted = elapsedTime > 0 || isRunning;

  // Progress percentage (20 minutes = 1200 seconds)
  const progressPercent = Math.min((elapsedTime / 1200) * 100, 100);

  return (
    <div className="flex items-center gap-4">
      {/* Timer Display */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
        darkMode ? 'bg-neutral-700' : 'bg-neutral-100'
      }`}>
        {/* Large Timer */}
        <div className={`font-mono text-2xl font-bold ${
          darkMode ? 'text-white' : 'text-neutral-800'
        }`}>
          {formatElapsedTime(elapsedTime)}
        </div>

        {/* Progress Bar */}
        <div className={`w-32 h-2 rounded-full overflow-hidden ${
          darkMode ? 'bg-neutral-600' : 'bg-neutral-200'
        }`}>
          <div 
            className="h-full bg-sky-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {!hasStarted ? (
          /* Start Button */
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            <Play size={18} fill="currentColor" />
            Start
          </button>
        ) : isRunning ? (
          /* Pause Button */
          <button
            onClick={onPause}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            <Pause size={18} />
            Pause
          </button>
        ) : (
          /* Resume Button */
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            <Play size={18} fill="currentColor" />
            Resume
          </button>
        )}

        {/* End Session Button */}
        <div className="relative">
          <button
            onClick={() => setShowEndConfirm(!showEndConfirm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <Square size={18} />
            End
          </button>

          {/* Confirmation Dropdown */}
          {showEndConfirm && (
            <div className={`absolute top-full mt-1 right-0 z-50 p-4 rounded-lg shadow-lg border w-64 ${
              darkMode 
                ? 'bg-neutral-800 border-neutral-600' 
                : 'bg-white border-neutral-200'
            }`}>
              <p className={`text-sm mb-3 ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                Are you sure you want to end this simulation?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium ${
                    darkMode 
                      ? 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600' 
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    onEnd();
                  }}
                  className="flex-1 px-3 py-1.5 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}



