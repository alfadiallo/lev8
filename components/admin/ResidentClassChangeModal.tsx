'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { X, AlertTriangle, User, Calendar, FileText } from 'lucide-react';
import { formatPGYLevel, calculatePGYLevel } from '@/lib/utils/pgy-calculator';

interface ResidentClassChangeModalProps {
  residentId: string;
  residentName: string;
  currentClassId: string;
  currentGraduationYear: number;
  onClose: () => void;
  onChanged: () => void;
}

interface ClassOption {
  id: string;
  graduation_year: number;
  name: string;
  is_active: boolean;
}

type ChangeReason = 'remediation' | 'leave_of_absence' | 'academic_extension' | 'administrative' | 'other';

const REASON_OPTIONS: { value: ChangeReason; label: string; description: string }[] = [
  { value: 'remediation', label: 'Remediation', description: 'Academic or clinical performance concerns' },
  { value: 'leave_of_absence', label: 'Leave of Absence', description: 'Medical, personal, or family leave' },
  { value: 'academic_extension', label: 'Academic Extension', description: 'Extended training period' },
  { value: 'administrative', label: 'Administrative', description: 'Program restructuring or administrative decision' },
  { value: 'other', label: 'Other', description: 'Other reason (specify in notes)' },
];

export default function ResidentClassChangeModal({
  residentId,
  residentName,
  currentClassId,
  currentGraduationYear,
  onClose,
  onChanged,
}: ResidentClassChangeModalProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reason, setReason] = useState<ChangeReason>('other');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('classes')
        .select('id, graduation_year, name, is_active')
        .order('graduation_year', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('[ClassChange] Error fetching classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || selectedClassId === currentClassId) {
      setError('Please select a different class');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user?.user?.id) throw new Error('Not authenticated');

      // 1. Insert audit record
      const { error: auditError } = await supabaseClient
        .from('resident_class_changes')
        .insert({
          resident_id: residentId,
          from_class_id: currentClassId,
          to_class_id: selectedClassId,
          reason: reason,
          effective_date: effectiveDate,
          notes: notes.trim() || null,
          changed_by: user.user.id,
        });

      if (auditError) throw auditError;

      // 2. Update resident's class_id
      const { error: updateError } = await supabaseClient
        .from('residents')
        .update({ class_id: selectedClassId, updated_at: new Date().toISOString() })
        .eq('id', residentId);

      if (updateError) throw updateError;

      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ClassChange] Error:', message);
      setError(`Failed to update class: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const currentPGY = calculatePGYLevel(currentGraduationYear);
  const newPGY = selectedClass ? calculatePGYLevel(selectedClass.graduation_year) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">Change Resident Class</h2>
            <p className="text-sm text-neutral-500 mt-1">Reassign {residentName} to a different class</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <p className="text-sm text-neutral-500 mb-2">Current Assignment</p>
            <div className="flex items-center gap-3">
              <User className="text-neutral-400" size={20} />
              <div>
                <p className="font-medium text-neutral-800">{residentName}</p>
                <p className="text-sm text-neutral-500">
                  Class of {currentGraduationYear} • {formatPGYLevel(currentPGY)}
                </p>
              </div>
            </div>
          </div>

          {/* New Class Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              New Class
            </label>
            {loading ? (
              <div className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
                required
              >
                <option value="">Select a class...</option>
                {classes
                  .filter(c => c.id !== currentClassId)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatPGYLevel(calculatePGYLevel(c.graduation_year))})
                      {!c.is_active && ' - Graduated'}
                    </option>
                  ))}
              </select>
            )}
            {selectedClass && (
              <p className="text-sm text-[#0EA5E9] mt-2">
                Will become {formatPGYLevel(newPGY!)} (Class of {selectedClass.graduation_year})
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Reason for Change
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ChangeReason)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
            >
              {REASON_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              {REASON_OPTIONS.find(o => o.value === reason)?.description}
            </p>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar className="inline-block mr-1" size={14} />
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9]"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FileText className="inline-block mr-1" size={14} />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional details about this class change..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-amber-800">
              <p className="font-medium">This action will be recorded</p>
              <p className="mt-1">Class changes are logged in the audit trail and cannot be undone automatically.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedClassId}
              className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Change Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}








