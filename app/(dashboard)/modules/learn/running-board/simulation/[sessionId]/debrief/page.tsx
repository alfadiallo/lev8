// Running the Board - Debrief Page
// Post-simulation debrief with auto-generated summary and structured feedback

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { SessionDebrief, MissedCriticalItem, PHASE_LABELS } from '@/lib/types/running-board';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Star,
  Plus,
  X,
  Save,
  Calendar,
} from 'lucide-react';

// Predefined options for strengths and areas for improvement
const STRENGTH_OPTIONS = [
  'Time management',
  'Prioritization',
  'Communication',
  'Delegation',
  'Critical thinking',
  'Procedural skills',
  'Team leadership',
  'Patient safety awareness',
];

const IMPROVEMENT_OPTIONS = [
  'Time management',
  'Prioritization',
  'Task delegation',
  'Communication with team',
  'Documentation',
  'Follow-up on results',
  'Reassessment',
  'Escalation timing',
];

export default function DebriefPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debrief, setDebrief] = useState<SessionDebrief | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ learner_name: string; preset_name: string } | null>(null);

  // Form state
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [customStrength, setCustomStrength] = useState('');
  const [customImprovement, setCustomImprovement] = useState('');

  useEffect(() => {
    loadDebrief();
  }, [sessionId]);

  const loadDebrief = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Load session info
      const sessionRes = await fetch(`/api/running-board/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionInfo({
          learner_name: sessionData.session.learner_name,
          preset_name: sessionData.session.preset_name,
        });
      }

      // Load debrief data
      const debriefRes = await fetch(`/api/running-board/sessions/${sessionId}/debrief`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (debriefRes.ok) {
        const data = await debriefRes.json();
        setDebrief(data.debrief);
        
        // Pre-fill form if data exists
        if (data.debrief.strengths?.length) setStrengths(data.debrief.strengths);
        if (data.debrief.areas_for_improvement?.length) setImprovements(data.debrief.areas_for_improvement);
        if (data.debrief.overall_score) setOverallScore(data.debrief.overall_score);
        if (data.debrief.facilitator_notes) setNotes(data.debrief.facilitator_notes);
        if (data.debrief.discussion_points_covered?.length) setDiscussionPoints(data.debrief.discussion_points_covered);
        if (data.debrief.follow_up_date) setFollowUpDate(data.debrief.follow_up_date);
      }
    } catch (error) {
      console.error('[Debrief] Error loading debrief:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return;

      await fetch(`/api/running-board/sessions/${sessionId}/debrief`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strengths,
          areas_for_improvement: improvements,
          overall_score: overallScore,
          facilitator_notes: notes,
          discussion_points_covered: discussionPoints,
          follow_up_date: followUpDate || null,
        }),
      });

      router.push('/modules/learn/running-board');
    } catch (error) {
      console.error('[Debrief] Error saving debrief:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStrength = (item: string) => {
    if (strengths.includes(item)) {
      setStrengths(strengths.filter(s => s !== item));
    } else {
      setStrengths([...strengths, item]);
    }
  };

  const toggleImprovement = (item: string) => {
    if (improvements.includes(item)) {
      setImprovements(improvements.filter(i => i !== item));
    } else {
      setImprovements([...improvements, item]);
    }
  };

  const addCustomStrength = () => {
    if (customStrength.trim() && !strengths.includes(customStrength.trim())) {
      setStrengths([...strengths, customStrength.trim()]);
      setCustomStrength('');
    }
  };

  const addCustomImprovement = () => {
    if (customImprovement.trim() && !improvements.includes(customImprovement.trim())) {
      setImprovements([...improvements, customImprovement.trim()]);
      setCustomImprovement('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/modules/learn/running-board')}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-semibold text-neutral-800">Session Debrief</h1>
              <p className="text-sm text-neutral-500">
                {sessionInfo?.learner_name} • {sessionInfo?.preset_name}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save & Exit'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Auto-Generated Summary */}
        {debrief && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="font-semibold text-neutral-800">Performance Summary</h2>
            </div>
            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-neutral-50 rounded-xl">
                  <div className="text-3xl font-bold text-neutral-800">
                    {debrief.completion_percentage}%
                  </div>
                  <div className="text-sm text-neutral-500">Completion</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">
                    {debrief.completed_actions}/{debrief.total_actions}
                  </div>
                  <div className="text-sm text-green-700">Actions Completed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-3xl font-bold text-red-600">
                    {debrief.critical_actions_missed}
                  </div>
                  <div className="text-sm text-red-700">Critical Actions Missed</div>
                </div>
              </div>

              {/* Missed Critical Actions */}
              {debrief.missed_critical_items && debrief.missed_critical_items.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-neutral-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    Missed Critical Actions
                  </h3>
                  <div className="space-y-2">
                    {debrief.missed_critical_items.map((item: MissedCriticalItem, idx: number) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                      >
                        <XCircle size={18} className="text-red-500 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-red-800">{item.label}</span>
                          <span className="text-red-600 text-sm ml-2">
                            ({item.case_title} • Phase {item.phase_id}: {PHASE_LABELS[item.phase_id as keyof typeof PHASE_LABELS]})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debrief.missed_critical_items?.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">All critical actions completed!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strengths */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Strengths</h2>
            <p className="text-sm text-neutral-500">What did the learner do well?</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {STRENGTH_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleStrength(option)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    strengths.includes(option)
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Custom strengths */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customStrength}
                onChange={(e) => setCustomStrength(e.target.value)}
                placeholder="Add custom strength..."
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                onKeyDown={(e) => e.key === 'Enter' && addCustomStrength()}
              />
              <button
                onClick={addCustomStrength}
                className="px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Selected custom items */}
            {strengths.filter(s => !STRENGTH_OPTIONS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {strengths.filter(s => !STRENGTH_OPTIONS.includes(s)).map(item => (
                  <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {item}
                    <button onClick={() => setStrengths(strengths.filter(s => s !== item))}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Areas for Improvement</h2>
            <p className="text-sm text-neutral-500">What could be improved?</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {IMPROVEMENT_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleImprovement(option)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    improvements.includes(option)
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Custom improvements */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customImprovement}
                onChange={(e) => setCustomImprovement(e.target.value)}
                placeholder="Add custom area..."
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                onKeyDown={(e) => e.key === 'Enter' && addCustomImprovement()}
              />
              <button
                onClick={addCustomImprovement}
                className="px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200"
              >
                <Plus size={18} />
              </button>
            </div>

            {improvements.filter(i => !IMPROVEMENT_OPTIONS.includes(i)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {improvements.filter(i => !IMPROVEMENT_OPTIONS.includes(i)).map(item => (
                  <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                    {item}
                    <button onClick={() => setImprovements(improvements.filter(i => i !== item))}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Overall Score</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => setOverallScore(score)}
                  className="p-2"
                >
                  <Star 
                    size={32} 
                    className={`transition-colors ${
                      overallScore && score <= overallScore
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-neutral-500 mt-2">
              {overallScore === 1 && 'Needs significant improvement'}
              {overallScore === 2 && 'Below expectations'}
              {overallScore === 3 && 'Meets expectations'}
              {overallScore === 4 && 'Above expectations'}
              {overallScore === 5 && 'Exceptional performance'}
            </p>
          </div>
        </div>

        {/* Facilitator Notes */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Facilitator Notes</h2>
          </div>
          <div className="p-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes from the debrief discussion..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Follow-up</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-neutral-400" />
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <span className="text-sm text-neutral-500">Schedule follow-up session (optional)</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.push('/modules/learn/running-board')}
            className="px-6 py-2 text-neutral-600 hover:text-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Debrief'}
          </button>
        </div>
      </main>
    </div>
  );
}





