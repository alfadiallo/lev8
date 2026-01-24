'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, Trophy, BarChart3, Users, Plus, 
  ArrowLeft, ChevronRight, Eye
} from 'lucide-react';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  mediumLight: '#95D5B2',
  medium: '#74C69D',
  mediumDark: '#52B788',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
  darkest: '#081C15',
};

interface InterviewDashboardProps {
  userEmail: string;
  userName: string | null;
  institutionName: string | null;
  programName: string | null;
  permission: 'guest' | 'faculty' | 'program_director' | 'admin';
  onBack: () => void;
}

interface TileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
  variant?: 'primary' | 'secondary';
}

function DashboardTile({ icon, title, description, onClick, badge, variant = 'primary' }: TileProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border transition-all hover:shadow-md hover:scale-[1.02] group"
      style={{ borderColor: COLORS.light }}
    >
      <div className="flex items-start justify-between">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ 
            backgroundColor: isPrimary ? COLORS.lightest : '#F1F5F9',
          }}
        >
          <div style={{ color: isPrimary ? COLORS.dark : '#64748B' }}>
            {icon}
          </div>
        </div>
        {badge && (
          <span 
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
          >
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        {title}
        <ChevronRight 
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
          style={{ color: COLORS.dark }}
        />
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </button>
  );
}

export default function InterviewDashboard({ 
  userEmail, 
  userName,
  institutionName,
  programName, 
  permission, 
  onBack 
}: InterviewDashboardProps) {
  const router = useRouter();
  const _searchParams = useSearchParams();
  
  const isPDorAdmin = permission === 'program_director' || permission === 'admin';
  const displayName = userName || userEmail;
  
  const handleNavigate = (path: string) => {
    router.push(`${path}?email=${encodeURIComponent(userEmail)}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome, {displayName}
        </h1>
        {(institutionName || programName) && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            {institutionName}{institutionName && programName ? ' • ' : ''}{programName}
          </p>
        )}
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {isPDorAdmin 
            ? 'Manage interview sessions, view rankings, and analyze interviewer stats'
            : 'View interview sessions and rate candidates'
          }
        </p>
        <div 
          className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          {permission === 'admin' ? 'Administrator' : 
           permission === 'program_director' ? 'Program Director' : 
           permission === 'faculty' ? 'Faculty' : 'Guest'}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleNavigate('/interview/create')}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
          >
            <Plus className="w-4 h-4" />
            Create Session
          </button>
          <button
            onClick={() => router.push('/interview')}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
          >
            <Users className="w-4 h-4" />
            Join Session
          </button>
        </div>
      </div>

      {/* Dashboard Tiles */}
      <div className="space-y-6">
        {/* Common Tiles */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Interview Management
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <DashboardTile
              icon={<Calendar className="w-6 h-6" />}
              title="Interview Dates"
              description={isPDorAdmin 
                ? "View all interview sessions, create new dates, and manage candidates"
                : "View interview sessions and the candidates you'll be rating"
              }
              onClick={() => handleNavigate('/interview/sessions')}
              variant="primary"
            />
            
            {isPDorAdmin && (
              <DashboardTile
                icon={<Trophy className="w-6 h-6" />}
                title="Rank List"
                description="View all candidates ranked by interview scores across the entire season"
                onClick={() => handleNavigate('/interview/season')}
                variant="primary"
              />
            )}
          </div>
        </div>

        {/* PD/Admin Only Tiles */}
        {isPDorAdmin && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Analytics & Insights
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <DashboardTile
                icon={<BarChart3 className="w-6 h-6" />}
                title="Interviewer Stats"
                description="Analyze how each interviewer rates compared to the group mean. Identify scoring patterns and calibration."
                onClick={() => handleNavigate('/interview/stats')}
                variant="primary"
              />
              <DashboardTile
                icon={<Eye className="w-6 h-6" />}
                title="Score Normalization"
                description="Compare raw vs normalized scores to see how rankings change when adjusting for interviewer styles"
                onClick={() => handleNavigate('/interview/season')}
                badge="On Rank List"
                variant="secondary"
              />
            </div>
          </div>
        )}

        {/* Faculty Info */}
        {!isPDorAdmin && (
          <div 
            className="rounded-xl p-4 border"
            style={{ backgroundColor: COLORS.lightest + '40', borderColor: COLORS.light }}
          >
            <p className="text-sm" style={{ color: COLORS.darker }}>
              <strong>Tip:</strong> After rating candidates, your scores contribute to the overall ranking. 
              Program directors can view aggregate statistics and interviewer calibration data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
