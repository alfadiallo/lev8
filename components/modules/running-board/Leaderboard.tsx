'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Trophy, 
  Clock, 
  Users, 
  Activity,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Flame,
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string | null;
  full_name: string;
  type: 'educator' | 'learner';
  session_count: number;
  total_time_seconds: number;
  last_activity: string;
  is_active_this_week: boolean;
}

interface LeaderboardStats {
  total_sessions: number;
  total_time_seconds: number;
  total_participants: number;
  active_this_week: number;
}

interface LeaderboardProps {
  className?: string;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function Leaderboard({ className = '' }: LeaderboardProps) {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/running-board/leaderboard?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setStats(data.stats || null);
        setCurrentUserId(data.current_user_id || null);
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-pulse h-6 w-32 bg-amber-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-700">
          <Trophy size={20} />
          <span className="font-medium">Leaderboard</span>
          <span className="text-sm text-amber-600">- Start a simulation to appear here!</span>
        </div>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-lg">🥇</span>;
    if (index === 1) return <span className="text-lg">🥈</span>;
    if (index === 2) return <span className="text-lg">🥉</span>;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-neutral-500">{index + 1}</span>;
  };

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy size={20} className="text-amber-600" />
          <span className="font-semibold text-amber-800">Leaderboard</span>
          {stats && (
            <div className="hidden sm:flex items-center gap-4 ml-4 text-sm">
              <div className="flex items-center gap-1 text-amber-700">
                <Users size={14} />
                <span>{stats.total_participants} participants</span>
              </div>
              <div className="flex items-center gap-1 text-amber-700">
                <Clock size={14} />
                <span>{Math.floor(stats.total_time_seconds / 3600)}h total</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Activity size={14} />
                <span>{stats.active_this_week} active this week</span>
              </div>
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-amber-600" />
        ) : (
          <ChevronDown size={20} className="text-amber-600" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Stats on mobile */}
          {stats && (
            <div className="sm:hidden flex items-center gap-4 mb-3 text-xs text-amber-700">
              <span>{stats.total_participants} participants</span>
              <span>•</span>
              <span>{Math.floor(stats.total_time_seconds / 3600)}h total</span>
              <span>•</span>
              <span className="text-green-600">{stats.active_this_week} active</span>
            </div>
          )}

          {/* Leaderboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {leaderboard.slice(0, 10).map((entry, index) => {
              const isCurrentUser = entry.user_id === currentUserId;
              
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isCurrentUser 
                      ? 'bg-sky-100 border border-sky-300' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                >
                  {/* Rank */}
                  {getRankBadge(index)}
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {entry.type === 'educator' ? (
                        <Briefcase size={12} className="text-purple-500 flex-shrink-0" />
                      ) : (
                        <User size={12} className="text-neutral-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-neutral-800 truncate text-sm">
                        {entry.full_name}
                      </span>
                      {entry.is_active_this_week && (
                        <Flame size={12} className="text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{entry.session_count} sessions</span>
                      <span>•</span>
                      <span>{formatDuration(entry.total_time_seconds)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}




