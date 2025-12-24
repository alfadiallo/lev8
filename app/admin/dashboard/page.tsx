'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
}

interface RecentRequest {
  id: string;
  full_name: string;
  personal_email: string;
  requested_role: string;
  created_at: string;
  status: string;
}

interface RecentActivity {
  id: string;
  action: string;
  action_type: string;
  created_at: string;
  admin: { full_name: string } | null;
  target_user: { full_name: string } | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Get total users
      const { count: totalUsers } = await supabaseClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users
      const { count: activeUsers } = await supabaseClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active');

      // Get pending requests
      const { count: pendingRequests } = await supabaseClient
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get approved this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: approvedThisMonth } = await supabaseClient
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('reviewed_at', startOfMonth.toISOString());

      // Get rejected this month
      const { count: rejectedThisMonth } = await supabaseClient
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('reviewed_at', startOfMonth.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingRequests: pendingRequests || 0,
        approvedThisMonth: approvedThisMonth || 0,
        rejectedThisMonth: rejectedThisMonth || 0,
      });

      // Get recent pending requests
      const { data: requests } = await supabaseClient
        .from('access_requests')
        .select('id, full_name, personal_email, requested_role, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRequests(requests || []);

      // Get recent activity
      const { data: activity } = await supabaseClient
        .from('admin_activity_log')
        .select(`
          id, action, action_type, created_at,
          admin:user_profiles!admin_activity_log_admin_id_fkey(full_name),
          target_user:user_profiles!admin_activity_log_target_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transform the activity data to match our interface
      const transformedActivity: RecentActivity[] = (activity || []).map(item => ({
        id: item.id,
        action: item.action,
        action_type: item.action_type,
        created_at: item.created_at,
        admin: Array.isArray(item.admin) ? item.admin[0] || null : item.admin,
        target_user: Array.isArray(item.target_user) ? item.target_user[0] || null : item.target_user,
      }));
      setRecentActivity(transformedActivity);
    } catch (error) {
      console.error('[AdminDashboard] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users,
      color: 'var(--theme-primary)'
    },
    { 
      label: 'Active Users', 
      value: stats.activeUsers, 
      icon: CheckCircle,
      color: 'var(--theme-success, #22c55e)'
    },
    { 
      label: 'Pending Requests', 
      value: stats.pendingRequests, 
      icon: Clock,
      color: 'var(--theme-warning, #f59e0b)',
      highlight: stats.pendingRequests > 0
    },
    { 
      label: 'Approved This Month', 
      value: stats.approvedThisMonth, 
      icon: TrendingUp,
      color: 'var(--theme-success, #22c55e)'
    },
  ];

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'resident': return 'var(--theme-primary)';
      case 'faculty': return 'var(--theme-success, #22c55e)';
      case 'program_director': return 'var(--theme-warning, #f59e0b)';
      default: return 'var(--theme-text-muted)';
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-bold"
            style={{ color: 'var(--theme-text)' }}
          >
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Manage users and access requests
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-6 rounded-2xl border transition-all duration-200"
              style={{
                background: stat.highlight 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
                  : 'var(--theme-surface-solid)',
                borderColor: stat.highlight 
                  ? 'var(--theme-warning, #f59e0b)'
                  : 'var(--theme-border-solid)',
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `${stat.color}20`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {stat.label}
                  </p>
                  <p 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div 
          className="rounded-2xl border p-6"
          style={{
            background: 'var(--theme-surface-solid)',
            borderColor: 'var(--theme-border-solid)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: 'var(--theme-text)' }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
              Pending Requests
            </h2>
            <Link href="/admin/requests">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div 
              className="text-center py-8"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/admin/requests?id=${request.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: 'var(--theme-surface-hover)',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ 
                      background: 'var(--theme-primary-soft)',
                      color: 'var(--theme-primary)'
                    }}
                  >
                    {request.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium truncate"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {request.full_name}
                    </p>
                    <p 
                      className="text-sm truncate"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {request.personal_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span 
                      className="inline-block px-2 py-1 text-xs rounded-full"
                      style={{ 
                        background: `${getRoleBadgeColor(request.requested_role)}20`,
                        color: getRoleBadgeColor(request.requested_role)
                      }}
                    >
                      {request.requested_role}
                    </span>
                    <p 
                      className="text-xs mt-1"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {formatTimeAgo(request.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div 
          className="rounded-2xl border p-6"
          style={{
            background: 'var(--theme-surface-solid)',
            borderColor: 'var(--theme-border-solid)',
          }}
        >
          <h2 
            className="text-xl font-bold flex items-center gap-2 mb-6"
            style={{ color: 'var(--theme-text)' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Recent Activity
          </h2>

          {recentActivity.length === 0 ? (
            <div 
              className="text-center py-8"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--theme-surface-hover)' }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                    style={{ 
                      background: activity.action_type.includes('approved') 
                        ? 'rgba(34, 197, 94, 0.2)'
                        : activity.action_type.includes('rejected')
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'var(--theme-primary-soft)',
                    }}
                  >
                    {activity.action_type.includes('approved') ? (
                      <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                    ) : activity.action_type.includes('rejected') ? (
                      <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    ) : (
                      <Users className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {activity.action}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {activity.admin?.full_name || 'System'} · {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div 
        className="rounded-2xl border p-6"
        style={{
          background: 'var(--theme-surface-solid)',
          borderColor: 'var(--theme-border-solid)',
        }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: 'var(--theme-text)' }}
        >
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/users?action=create">
            <Button variant="primary">
              <Users className="w-4 h-4 mr-2" />
              Create New User
            </Button>
          </Link>
          <Link href="/admin/requests">
            <Button variant="secondary">
              <ClipboardList className="w-4 h-4 mr-2" />
              Review Requests
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              Back to Main App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

