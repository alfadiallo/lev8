'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Activity,
  BarChart3,
  Settings,
  ChevronRight,
  User,
  Calendar
} from 'lucide-react';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';

// Purple color palette
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  mediumLight: '#C4B5FD',
  medium: '#A78BFA',
  mediumDark: '#8B5CF6',
  dark: '#7C3AED',
  darker: '#6D28D9',
  veryDark: '#5B21B6',
  darkest: '#4C1D95',
};

interface Provider {
  id: string;
  name: string;
  email: string;
  provider_type: string;
  credential: string | null;
}

interface Rating {
  id: string;
  provider_id: string;
  provider_name: string;
  status: string;
  eq_total: number | null;
  pq_total: number | null;
  iq_total: number | null;
  overall_total: number | null;
  completed_at: string | null;
}

interface DashboardData {
  providers: Provider[];
  pendingRatings: Rating[];
  completedRatings: Rating[];
  stats: {
    totalProviders: number;
    pendingCount: number;
    completedCount: number;
    completionRate: number;
  };
}

export default function PulseCheckDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    user, 
    isLoading: isUserLoading, 
    isAuthenticated, 
    login,
    isMedicalDirector, 
    isRegionalDirector, 
    isAdminAssistant 
  } = usePulseCheckUserContext();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  // Redirect Medical Directors directly to providers page
  useEffect(() => {
    if (!isUserLoading && isAuthenticated && isMedicalDirector) {
      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      router.replace(`/pulsecheck/providers${emailParam}`);
    }
  }, [isUserLoading, isAuthenticated, isMedicalDirector, router, user?.email]);

  // Redirect Regional Directors directly to reports page
  useEffect(() => {
    if (!isUserLoading && isAuthenticated && isRegionalDirector) {
      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      router.replace(`/pulsecheck/reports${emailParam}`);
    }
  }, [isUserLoading, isAuthenticated, isRegionalDirector, router, user?.email]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.directorId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch providers
        const providersRes = await fetch(`/api/pulsecheck/providers?director_id=${user.directorId}`);
        const providersData = await providersRes.json();

        // Fetch ratings
        const ratingsRes = await fetch(`/api/pulsecheck/ratings?director_id=${user.directorId}`);
        const ratingsData = await ratingsRes.json();

        const providers = providersData.providers || [];
        const ratings = ratingsData.ratings || [];

        const pendingRatings = ratings.filter((r: Rating) => r.status !== 'completed');
        const completedRatings = ratings.filter((r: Rating) => r.status === 'completed');

        setData({
          providers,
          pendingRatings,
          completedRatings,
          stats: {
            totalProviders: providers.length,
            pendingCount: pendingRatings.length,
            completedCount: completedRatings.length,
            completionRate: providers.length > 0 
              ? Math.round((completedRatings.length / providers.length) * 100) 
              : 0,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.dark }}
        />
      </div>
    );
  }

  if (!isAuthenticated || user?.role === 'guest') {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.dark }} />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">
          You are not registered as a Pulse Check user. Please contact your administrator for access.
        </p>
        <Link
          href="/pulsecheck"
          className="text-white px-6 py-2 rounded-lg font-medium inline-block"
          style={{ backgroundColor: COLORS.dark }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome {user?.name || 'User'}
        </h1>
        <p className="text-slate-600">
          {(isRegionalDirector || isAdminAssistant) && user?.healthsystemName
            ? user.healthsystemName
            : user?.siteName && user?.departmentName 
            ? `${user.siteName} • ${user.departmentName}`
            : user?.siteName
            ? user.siteName
            : user?.healthsystemName
            ? user.healthsystemName
            : 'Pulse Check Dashboard'}
        </p>
      </div>

      {/* Quick Actions - Role Based */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Medical Directors: My Providers */}
        {isMedicalDirector && (
          <Link
            href={`/pulsecheck/providers${emailParam}`}
            className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: COLORS.lightest }}
                >
                  <Users className="w-5 h-5" style={{ color: COLORS.dark }} />
                </div>
                <h3 className="font-semibold text-slate-900">My Providers</h3>
                <p className="text-sm text-slate-500">
                  {data?.stats.totalProviders || 0} providers
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        )}

        {/* Regional Directors / Admin: Reports */}
        {(isRegionalDirector || isAdminAssistant) && (
          <Link
            href={`/pulsecheck/reports${emailParam}`}
            className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: COLORS.lightest }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: COLORS.dark }} />
                </div>
                <h3 className="font-semibold text-slate-900">Reports</h3>
                <p className="text-sm text-slate-500">View analytics</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        )}

        {/* Admin: User Management */}
        {isAdminAssistant && (
          <Link
            href={`/pulsecheck/admin${emailParam}`}
            className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: COLORS.lightest }}
                >
                  <Settings className="w-5 h-5" style={{ color: COLORS.dark }} />
                </div>
                <h3 className="font-semibold text-slate-900">Admin</h3>
                <p className="text-sm text-slate-500">Manage users</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        )}
      </div>

      {/* Stats Cards - For Medical Directors */}
      {isMedicalDirector && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            className="bg-white rounded-xl border p-6"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <Clock className="w-5 h-5" style={{ color: '#D97706' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.stats.pendingCount}</p>
                <p className="text-sm text-slate-500">Pending Reviews</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl border p-6"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#DCFCE7' }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.stats.completedCount}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl border p-6"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.lightest }}
              >
                <Activity className="w-5 h-5" style={{ color: COLORS.dark }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.stats.completionRate}%</p>
                <p className="text-sm text-slate-500">Completion Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider List for Medical Directors */}
      {isMedicalDirector && data && data.providers.length > 0 && (
        <div 
          className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: COLORS.light }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.lightest }}>
            <h2 className="font-semibold text-slate-900">My Providers</h2>
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.lightest }}>
            {data.providers.slice(0, 5).map((provider) => {
              const rating = data.completedRatings.find(r => r.provider_id === provider.id);
              const isPending = data.pendingRatings.some(r => r.provider_id === provider.id);

              return (
                <div key={provider.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: COLORS.medium }}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {provider.name}
                          {provider.credential && (
                            <span className="text-slate-500 font-normal">, {provider.credential}</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{provider.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {rating && (
                        <div className="text-right">
                          <div className="font-medium" style={{ color: COLORS.dark }}>
                            {rating.overall_total?.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-500">Overall</div>
                        </div>
                      )}
                      <Link
                        href={`/pulsecheck/rate${emailParam}&provider=${provider.id}`}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          isPending || !rating
                            ? 'text-white'
                            : 'text-slate-700'
                        }`}
                        style={isPending || !rating 
                          ? { backgroundColor: COLORS.dark }
                          : { backgroundColor: COLORS.lightest }}
                      >
                        {isPending ? 'Continue' : rating ? 'View' : 'Rate'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {data.providers.length > 5 && (
            <Link
              href={`/pulsecheck/providers${emailParam}`}
              className="block px-6 py-3 text-center text-sm font-medium hover:bg-slate-50"
              style={{ color: COLORS.dark }}
            >
              View all {data.providers.length} providers
            </Link>
          )}
        </div>
      )}

      {/* Empty State */}
      {isMedicalDirector && data && data.providers.length === 0 && (
        <div 
          className="bg-white rounded-xl border p-8 text-center"
          style={{ borderColor: COLORS.light }}
        >
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-slate-900 mb-2">No Providers Assigned</h3>
          <p className="text-slate-600 mb-4">
            You don&apos;t have any providers assigned to you yet. Contact your administrator.
          </p>
        </div>
      )}

      {/* Regional Director View */}
      {isRegionalDirector && (
        <div 
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: COLORS.light }}
        >
          <h2 className="font-semibold text-slate-900 mb-4">Regional Overview</h2>
          <p className="text-slate-600">
            As a Regional Director, you can view reports and analytics across all departments.
          </p>
          <Link
            href={`/pulsecheck/reports${emailParam}`}
            className="mt-4 inline-block text-white px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: COLORS.dark }}
          >
            View Reports
          </Link>
        </div>
      )}
    </div>
  );
}
