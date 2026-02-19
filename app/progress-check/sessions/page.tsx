'use client';

import { Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import { useRequireProgressCheckAuth, useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

export default function ProgressCheckSessionsPage() {
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
          Progress Check Sessions
        </h1>
        <p className="text-slate-600 mt-1">
          Schedule and manage progress check meetings
        </p>
      </div>

      <div
        className="bg-white rounded-xl border p-12 text-center"
        style={{ borderColor: COLORS.light }}
      >
        <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Progress Check Sessions Coming Soon
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          This feature will allow you to schedule progress check meetings, assign residents for discussion,
          and track outcomes with timed presentations and structured note-taking.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 max-w-xl mx-auto">
          <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: COLORS.dark }} />
            <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
              Resident Queue
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: COLORS.dark }} />
            <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
              Timed Discussions
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: COLORS.dark }} />
            <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
              Outcome Tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
