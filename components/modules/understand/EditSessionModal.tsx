'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Save } from 'lucide-react';

interface CCCSession {
  id: string;
  session_date: string;
  academic_year: string;
  session_type: string;
  title: string | null;
  duration_minutes: number;
  created_at: string;
  program_id: string;
  pgy_level: number | null;
}

interface EditSessionModalProps {
  session: CCCSession;
  onClose: () => void;
  onUpdated: (updatedSession: CCCSession) => void;
}

export default function EditSessionModal({ session, onClose, onUpdated }: EditSessionModalProps) {
  const [title, setTitle] = useState(session.title || '');
  const [sessionDate, setSessionDate] = useState(
    new Date(session.session_date).toISOString().split('T')[0]
  );
  const [sessionType, setSessionType] = useState(session.session_type || 'Spring');
  const [durationMinutes, setDurationMinutes] = useState(session.duration_minutes || 60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v2/sessions/ccc/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          sessionDate,
          sessionType,
          durationMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      const data = await response.json();
      
      // Return updated session to parent
      onUpdated({
        ...session,
        title: title || null,
        session_date: sessionDate,
        session_type: sessionType,
        duration_minutes: durationMinutes,
      });
    } catch (err) {
      console.error('[EditSession] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">Edit CCC Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Session Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spring CCC 2025-2026"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
            />
          </div>

          {/* Session Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
            >
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Ad-hoc">Ad-hoc</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock size={14} className="inline mr-1" />
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              min={15}
              max={480}
              step={15}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
