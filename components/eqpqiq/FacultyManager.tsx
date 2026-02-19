'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, UserCheck, UserX } from 'lucide-react';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface FacultyMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  credentials: string | null;
  is_active: boolean;
  faculty_type: 'core' | 'teaching';
}

interface FacultyManagerProps {
  programId: string;
}

export default function FacultyManager({ programId }: FacultyManagerProps) {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await fetch(`/api/progress-check/faculty?program_id=${programId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFaculty(data.faculty || []);
    } catch {
      setError('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const handleUpdate = async (facultyId: string, updates: { is_active?: boolean; faculty_type?: string }) => {
    setUpdatingId(facultyId);
    setError('');
    try {
      const res = await fetch('/api/progress-check/faculty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty_id: facultyId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      await fetchFaculty();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.dark }} />
        <span className="text-sm text-slate-500">Loading faculty...</span>
      </div>
    );
  }

  const active = faculty.filter(f => f.is_active);
  const inactive = faculty.filter(f => !f.is_active);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="text-sm text-slate-500">
        {active.length} active · {inactive.length} inactive
      </div>

      {/* Active faculty */}
      <div className="space-y-1">
        {active.map(f => (
          <FacultyRow
            key={f.id}
            faculty={f}
            updating={updatingId === f.id}
            onToggleActive={() => handleUpdate(f.id, { is_active: false })}
            onChangeType={(type) => handleUpdate(f.id, { faculty_type: type })}
          />
        ))}
      </div>

      {/* Inactive faculty */}
      {inactive.length > 0 && (
        <>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-2">
            Inactive
          </div>
          <div className="space-y-1">
            {inactive.map(f => (
              <FacultyRow
                key={f.id}
                faculty={f}
                updating={updatingId === f.id}
                onToggleActive={() => handleUpdate(f.id, { is_active: true })}
                onChangeType={(type) => handleUpdate(f.id, { faculty_type: type })}
              />
            ))}
          </div>
        </>
      )}

      {faculty.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No faculty found for this program.</p>
      )}
    </div>
  );
}

function FacultyRow({
  faculty,
  updating,
  onToggleActive,
  onChangeType,
}: {
  faculty: FacultyMember;
  updating: boolean;
  onToggleActive: () => void;
  onChangeType: (type: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        faculty.is_active
          ? 'bg-white border-slate-200'
          : 'bg-slate-50 border-slate-100 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          faculty.is_active ? 'text-white' : 'bg-slate-200 text-slate-400'
        }`} style={faculty.is_active ? { backgroundColor: COLORS.dark } : undefined}>
          {faculty.full_name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {faculty.full_name}
            {faculty.credentials && (
              <span className="text-slate-400 font-normal">, {faculty.credentials}</span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate">{faculty.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {updating ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            {/* Type selector */}
            <select
              value={faculty.faculty_type}
              onChange={(e) => onChangeType(e.target.value)}
              disabled={!faculty.is_active}
              className="text-xs px-2 py-1 border rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: COLORS.light }}
            >
              <option value="core">Core</option>
              <option value="teaching">Teaching</option>
            </select>

            {/* Active toggle */}
            <button
              onClick={onToggleActive}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                faculty.is_active
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'text-white hover:opacity-90'
              }`}
              style={!faculty.is_active ? { backgroundColor: COLORS.dark, borderColor: COLORS.dark } : undefined}
              title={faculty.is_active ? 'Deactivate faculty member' : 'Reactivate faculty member'}
            >
              {faculty.is_active ? (
                <><UserX className="w-3 h-3" /> Deactivate</>
              ) : (
                <><UserCheck className="w-3 h-3" /> Activate</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
