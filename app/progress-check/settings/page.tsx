'use client';

import { Settings, Users, School, Building2 } from 'lucide-react';
import { useRequireProgressCheckAuth, useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import FrameworkEditor from '@/components/eqpqiq/FrameworkEditor';
import FacultyManager from '@/components/eqpqiq/FacultyManager';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

export default function ProgressCheckSettingsPage() {
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  if (!can('canManageSurveys')) {
    return (
      <div className="text-center py-12">
        <Settings className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-lg font-medium text-slate-900">Access Restricted</p>
        <p className="text-sm text-slate-500 mt-1">
          Only Program Directors can access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
          Settings
        </h1>
        <p className="text-slate-600 mt-1">
          Manage program configuration and team access
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <Building2 className="w-8 h-8 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-semibold text-slate-900 mb-1">Program Info</h3>
          <p className="text-sm text-slate-500 mb-4">
            View and update program details
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Program</span>
              <span className="font-medium">{user?.programName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Institution</span>
              <span className="font-medium">{user?.institutionName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 sm:col-span-2" style={{ borderColor: COLORS.light }}>
          <Users className="w-8 h-8 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-semibold text-slate-900 mb-1">Faculty Management</h3>
          <p className="text-sm text-slate-500 mb-4">
            Toggle active/inactive status and assign faculty type (Core / Teaching).
          </p>
          {user?.programId && <FacultyManager programId={user.programId} />}
        </div>

        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <School className="w-8 h-8 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-semibold text-slate-900 mb-1">Classes</h3>
          <p className="text-sm text-slate-500">
            Manage graduation year cohorts and class rosters. Coming soon.
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <Settings className="w-8 h-8 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-semibold text-slate-900 mb-1">Evaluation Periods</h3>
          <p className="text-sm text-slate-500">
            Configure evaluation cycles and scoring periods. Coming soon.
          </p>
        </div>
      </div>

      {/* Evaluation Framework Editor */}
      {user?.programId && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: COLORS.veryDark }}>
            Evaluation Framework
          </h2>
          <FrameworkEditor programId={user.programId} />
        </div>
      )}
    </div>
  );
}
