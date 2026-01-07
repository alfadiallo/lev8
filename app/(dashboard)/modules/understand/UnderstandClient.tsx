'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight,
  Presentation,
  UserCircle,
  BookOpen,
  User
} from 'lucide-react';
import { formatPGYLevel } from '@/lib/utils/pgy-calculator';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { FacultyOnly } from '@/components/auth/PermissionGate';
import CreateSessionModal from './CreateSessionModal';

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

interface UnderstandClientProps {
  initialSessions: CCCSession[];
}

export default function UnderstandClient({ initialSessions }: UnderstandClientProps) {
  const router = useRouter();
  const permissions = usePermissions();
  const [sessions, setSessions] = useState<CCCSession[]>(initialSessions);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSessionCreated = (sessionId: string) => {
    setShowCreateModal(false);
    router.push(`/modules/understand/${sessionId}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <Presentation className="text-[#0EA5E9]" size={32} />
            Understand
          </h1>
          <p className="text-neutral-600 mt-2">
            Resident analytics, data presentation, and CCC meeting interface
          </p>
        </div>
      </div>

      {/* Sub-Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Residents Portal Card - Different for residents vs faculty */}
        {permissions.canViewAllResidents ? (
          // Faculty+ sees all residents
          <button
            onClick={() => router.push('/modules/understand/residents')}
            className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-left hover:shadow-xl hover:bg-white/80 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4A90A8]/20 to-[#0EA5E9]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCircle className="text-[#4A90A8]" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  Residents
                  <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Browse all residents by class. View comprehensive data including ITE scores, ROSH progress, procedures, and more.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-[#4A90A8]/10 text-[#4A90A8] px-2 py-1 rounded-full font-medium">
                    <BookOpen size={12} className="inline mr-1" />
                    Look Book
                  </span>
                </div>
              </div>
            </div>
          </button>
        ) : (
          // Residents see "My Profile" card
          <button
            onClick={() => router.push('/modules/understand/my-profile')}
            className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-left hover:shadow-xl hover:bg-white/80 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4A90A8]/20 to-[#0EA5E9]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="text-[#4A90A8]" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  My Profile
                  <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  View your performance data, ITE scores, evaluations, and SWOT analysis.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-[#4A90A8]/10 text-[#4A90A8] px-2 py-1 rounded-full font-medium">
                    <User size={12} className="inline mr-1" />
                    Personal Data
                  </span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Class Cohort Card */}
        <button
          onClick={() => router.push('/modules/understand/class')}
          className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-left hover:shadow-xl hover:bg-white/80 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7EC8E3]/20 to-[#95E1D3]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="text-[#7EC8E3]" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                Class Cohort
                <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-neutral-600 text-sm mt-1">
                View aggregated analytics by graduation year. Compare class performance, SWOT themes, and trends.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-[#7EC8E3]/10 text-[#7EC8E3] px-2 py-1 rounded-full font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Program-Wide Card */}
        <button
          onClick={() => router.push('/modules/understand/program')}
          className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-left hover:shadow-xl hover:bg-white/80 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Presentation className="text-[#4ECDC4]" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                Program-Wide
                <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-neutral-600 text-sm mt-1">
                Program-level analytics across all classes. Longitudinal trends and year-over-year comparisons.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-[#4ECDC4]/10 text-[#4ECDC4] px-2 py-1 rounded-full font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* CCC Meetings Card - Faculty only */}
        <FacultyOnly>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 text-left hover:shadow-xl hover:bg-white/80 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0EA5E9]/20 to-[#4A90A8]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="text-[#0EA5E9]" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  CCC Meetings
                  <Plus size={18} className="text-neutral-400 group-hover:rotate-90 transition-transform" />
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Create and manage Clinical Competency Committee sessions. Present resident data with timed discussions.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-[#0EA5E9]/10 text-[#0EA5E9] px-2 py-1 rounded-full font-medium">
                    <Clock size={12} className="inline mr-1" />
                    Timed Sessions
                  </span>
                </div>
              </div>
            </div>
          </button>
        </FacultyOnly>
      </div>

      {/* Recent CCC Sessions List - Faculty only */}
      <FacultyOnly>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-neutral-200/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-700">Recent CCC Sessions</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white text-sm rounded-lg hover:bg-[#0284C7] transition-colors"
            >
              <Plus size={16} />
              New Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-neutral-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-neutral-600 mb-2">No CCC Sessions Yet</h3>
              <p className="text-neutral-500 mb-6">Create your first CCC session to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors"
              >
                Create Session
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/modules/understand/${session.id}`)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9]/20 to-[#4A90A8]/20 flex items-center justify-center">
                      <Calendar className="text-[#0EA5E9]" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">
                        {session.title || `${session.session_type} CCC ${session.academic_year}`}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(session.session_date)}
                        </span>
                        {session.pgy_level && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {formatPGYLevel(session.pgy_level)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {session.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-neutral-400" size={20} />
                </button>
              ))}
            </div>
          )}
        </div>
      </FacultyOnly>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleSessionCreated}
        />
      )}
    </div>
  );
}



