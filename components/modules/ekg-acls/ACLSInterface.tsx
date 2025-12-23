// ACLS Interface Component - Main simulation interface

'use client';

import { useState, useEffect } from 'react';
import { useSim } from '@/lib/sim/hooks/useSim';
import { Scenario } from '@/lib/sim/state/types';
import EKGCanvas from './EKGCanvas';

interface ACLSInterfaceProps {
  scenario: Scenario;
  onSaveSession?: (sessionData: any) => Promise<void>;
}

export default function ACLSInterface({ scenario, onSaveSession }: ACLSInterfaceProps) {
  const { ctx, node, secondsLeft, choose } = useSim(scenario);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(25);
  const [displayedRhythm, setDisplayedRhythm] = useState(node.rhythm);

  useEffect(() => {
    if (node.entryAnim === 'shock') {
      setDisplayedRhythm('Asystole');
      const t = setTimeout(() => setDisplayedRhythm(node.rhythm), 250);
      return () => clearTimeout(t);
    } else {
      setDisplayedRhythm(node.rhythm);
    }
  }, [node.rhythm, node.entryAnim]);

  const getRate = () => {
    switch (node.rhythm) {
      case 'NSR':
        return '72 bpm';
      case 'VF':
        return '—';
      case 'pVT':
        return '170 bpm';
      case 'PEA':
        return '50 bpm';
      case 'Asystole':
        return '—';
    }
  };

  const getQRS = () => {
    switch (node.rhythm) {
      case 'pVT':
        return '≥140ms';
      case 'NSR':
        return '100ms';
      default:
        return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Panel */}
      <div className="flex justify-between bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
        <InfoItem label="rate" value={getRate()} />
        <InfoItem label="rhythm" value={node.rhythm.toLowerCase()} />
        <InfoItem label="pr" value={node.rhythm === 'NSR' ? '160ms' : '—'} />
        <InfoItem label="qrs" value={getQRS()} />
        <InfoItem label="qt" value={node.rhythm === 'NSR' ? '400ms' : '—'} />
      </div>

      {/* EKG Display */}
      <div className="bg-black border border-white/30 p-0 overflow-hidden rounded-2xl">
        <EKGCanvas rhythm={displayedRhythm} speedMmPerSec={speed} paused={paused} />
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
        <div className="flex gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-4 py-2 bg-white/30 border border-white/40 text-neutral-700 rounded-xl hover:bg-white/50 transition-colors text-sm font-medium"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/30 border border-white/40 text-neutral-700 rounded-xl hover:bg-white/50 transition-colors text-sm font-medium"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-neutral-600 text-sm">Speed</label>
          <input
            type="range"
            min="10"
            max="50"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-24 h-1 bg-neutral-300 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-neutral-800 text-sm min-w-12">{speed}mm/s</span>
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
        <div className="text-neutral-600 text-sm mb-2 uppercase tracking-wide">
          Current Phase: {node.phase}
        </div>
        <div className="text-neutral-800">
          {node.phase === 'analyze' && 'Patient found unresponsive. Check pulse and rhythm.'}
          {node.phase === 'shock' && 'Defibrillation delivered. Resume CPR immediately.'}
          {node.phase === 'cpr' && 'CPR in progress.'}
          {node.phase === 'reassess' && 'After 2 minutes of CPR. Check pulse and rhythm.'}
          {node.phase === 'postROSC' && 'Return of spontaneous circulation achieved!'}
        </div>
      </div>

      {/* Vital Signs and Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vital Signs */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
          <div className="text-neutral-600 text-sm mb-4 uppercase tracking-wide border-b border-white/30 pb-2">
            Vital Signs
          </div>
          <div className="space-y-3">
            <Row label="blood pressure" value={node.clinical.BP} />
            <Row label="etco₂" value={`${node.clinical.ETCO2} mmHg`} />
            <Row label="appearance" value={node.clinical.appearance} />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
          <div className="flex items-center justify-between mb-4 border-b border-white/30 pb-2">
            <div className="text-neutral-600 text-sm uppercase tracking-wide">Actions</div>
            <div className="text-xs text-neutral-500">Click to advance</div>
          </div>
          <div className="space-y-2">
            {node.choices.length > 0 ? (
              node.choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => choose(c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                    c.isCorrect === true
                      ? 'border-[#86C5A8] text-[#86C5A8] bg-[#86C5A8]/10 hover:bg-[#86C5A8]/20'
                      : c.isCorrect === false
                      ? 'border-[#F4A5A5] text-[#F4A5A5] bg-[#F4A5A5]/10 hover:bg-[#F4A5A5]/20'
                      : 'border-white/40 text-neutral-700 bg-white/30 hover:bg-white/50'
                  }`}
                  title={typeof c.isCorrect === 'boolean' ? (c.isCorrect ? 'Recommended' : 'Not recommended') : ''}
                >
                  {c.label}
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-neutral-500 text-sm">
                {node.phase === 'postROSC' ? 'Scenario Complete - ROSC Achieved!' : 'No actions available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-neutral-600 lowercase text-xs">{label}</span>
      <span className="text-neutral-800 font-semibold">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/20 last:border-0">
      <span className="text-neutral-600 text-sm lowercase">{label}</span>
      <span className="text-[#7EC8E3] text-sm font-medium">{value}</span>
    </div>
  );
}


