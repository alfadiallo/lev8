'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, User, CheckCircle, Clock, Filter, Stethoscope, UserCog, ChevronDown, ChevronUp } from 'lucide-react';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';
import { MiniSparkline } from '@/components/pulsecheck/Sparkline';

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

// Role labels for display
const ROLE_LABELS: Record<string, string> = {
  regional_director: 'Regional Director',
  medical_director: 'Medical Director',
  associate_medical_director: 'Associate Medical Director',
  assistant_medical_director: 'Assistant Medical Director',
  admin_assistant: 'Admin Assistant',
  guest: 'Guest',
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
  status: string;
  overall_total: number | null;
  completed_at: string | null;
  eq_total?: number | null;
  pq_total?: number | null;
  iq_total?: number | null;
  metric_los?: number | null;
  metric_imaging_util?: number | null;
  metric_pph?: number | null;
}

interface RatingHistory {
  provider_id: string;
  scores: number[];
  eq_scores: number[];
  pq_scores: number[];
  iq_scores: number[];
}

export default function PulseCheckProvidersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login, isMedicalDirector } = usePulseCheckUserContext();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.directorId) {
        setIsLoading(false);
        return;
      }

      try {
        const [providersRes, ratingsRes, historyRes] = await Promise.all([
          fetch(`/api/pulsecheck/providers?director_id=${user.directorId}`),
          fetch(`/api/pulsecheck/ratings?director_id=${user.directorId}&include_scores=true`),
          fetch(`/api/pulsecheck/ratings/history?director_id=${user.directorId}`),
        ]);

        const providersData = await providersRes.json();
        const ratingsData = await ratingsRes.json();
        const historyData = await historyRes.json();

        setProviders(providersData.providers || []);
        setRatings(ratingsData.ratings || []);
        setRatingHistory(historyData.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load providers');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    // Search filter
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const rating = ratings.find(r => r.provider_id === provider.id);
    const isCompleted = rating?.status === 'completed';
    
    if (filterType === 'pending' && isCompleted) return false;
    if (filterType === 'completed' && !isCompleted) return false;
    
    return matchesSearch;
  });

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

  // Split providers by type
  const physicians = filteredProviders.filter(p => p.provider_type === 'physician');
  const apcs = filteredProviders.filter(p => p.provider_type === 'apc');

  // Calculate stats
  const pendingCount = providers.filter(p => {
    const rating = ratings.find(r => r.provider_id === p.id);
    return !rating || rating.status !== 'completed';
  }).length;
  const completedCount = providers.length - pendingCount;

  // Provider row component with accordion
  const ProviderRow = ({ provider }: { provider: Provider }) => {
    const rating = ratings.find(r => r.provider_id === provider.id);
    const isCompleted = rating?.status === 'completed';
    const isPending = rating && !isCompleted;
    const isExpanded = expandedProviderId === provider.id;
    const history = ratingHistory.find(h => h.provider_id === provider.id);

    const toggleExpanded = () => {
      setExpandedProviderId(isExpanded ? null : provider.id);
    };

    return (
      <div className={`transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
        {/* Main row */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Expand button */}
              {isCompleted && (
                <button 
                  onClick={toggleExpanded}
                  className="p-1 rounded hover:bg-slate-200 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              )}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
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
            <div className="flex items-center gap-4">
              {/* Sparkline trend (if has history) */}
              {isCompleted && history && history.scores.length > 1 && (
                <MiniSparkline data={history.scores} />
              )}

              {/* Status Badge */}
              {isCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Not Started</span>
                </div>
              )}

              {/* Score */}
              {isCompleted && rating?.overall_total && (
                <div className="text-right min-w-[60px]">
                  <div className="font-bold text-lg" style={{ color: COLORS.dark }}>
                    {rating.overall_total.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Score</div>
                </div>
              )}

              {/* Action Button */}
              <Link
                href={`/pulsecheck/rate${emailParam}&provider=${provider.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  !isCompleted ? 'text-white' : 'text-slate-700'
                }`}
                style={!isCompleted 
                  ? { backgroundColor: COLORS.dark }
                  : { backgroundColor: COLORS.lightest }}
              >
                {isPending ? 'Continue' : isCompleted ? 'View/Edit' : 'Start Rating'}
              </Link>
            </div>
          </div>
        </div>

        {/* Accordion expanded content */}
        {isExpanded && isCompleted && rating && (
          <div className="px-6 pb-4 pt-0 ml-[68px]">
            <div 
              className="rounded-lg p-4 border"
              style={{ borderColor: COLORS.light, backgroundColor: 'white' }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* EQ/PQ/IQ Scores */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">EQ Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                      {rating.eq_total?.toFixed(1) || '-'}
                    </span>
                    {history && history.eq_scores.length > 1 && (
                      <MiniSparkline data={history.eq_scores} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">PQ Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                      {rating.pq_total?.toFixed(1) || '-'}
                    </span>
                    {history && history.pq_scores.length > 1 && (
                      <MiniSparkline data={history.pq_scores} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">IQ Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                      {rating.iq_total?.toFixed(1) || '-'}
                    </span>
                    {history && history.iq_scores.length > 1 && (
                      <MiniSparkline data={history.iq_scores} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                  <span className="text-sm text-slate-700">
                    {rating.completed_at 
                      ? new Date(rating.completed_at).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Operational Metrics */}
              {(rating.metric_los || rating.metric_imaging_util || rating.metric_pph) && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.lightest }}>
                  <p className="text-xs font-medium text-slate-500 mb-2">Operational Metrics</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">LOS (min)</p>
                      <span className="text-sm font-medium text-slate-700">
                        {rating.metric_los || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Imaging Util</p>
                      <span className="text-sm font-medium text-slate-700">
                        {rating.metric_imaging_util ? `${rating.metric_imaging_util}%` : '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">PPH</p>
                      <span className="text-sm font-medium text-slate-700">
                        {rating.metric_pph?.toFixed(2) || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {user?.name ? `Welcome ${user.name}` : 'My Providers'}
        </h1>
        <p className="text-slate-600">
          {user?.siteName && user?.departmentName 
            ? `${user.siteName} • ${user.departmentName}`
            : user?.siteName
            ? user.siteName
            : 'Pulse Check Provider Reviews'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-xl border p-4"
          style={{ borderColor: COLORS.light }}
        >
          <p className="text-2xl font-bold text-slate-900">{providers.length}</p>
          <p className="text-sm text-slate-500">Total Providers</p>
        </div>
        <div 
          className="bg-white rounded-xl border p-4"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" style={{ color: COLORS.dark }} />
            <p className="text-2xl font-bold text-slate-900">{providers.filter(p => p.provider_type === 'physician').length}</p>
          </div>
          <p className="text-sm text-slate-500">Physicians</p>
        </div>
        <div 
          className="bg-white rounded-xl border p-4"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4" style={{ color: COLORS.dark }} />
            <p className="text-2xl font-bold text-slate-900">{providers.filter(p => p.provider_type === 'apc').length}</p>
          </div>
          <p className="text-sm text-slate-500">APCs</p>
        </div>
        <div 
          className="bg-white rounded-xl border p-4"
          style={{ borderColor: COLORS.light }}
        >
          <p className="text-2xl font-bold" style={{ color: pendingCount > 0 ? '#D97706' : '#16A34A' }}>
            {pendingCount}
          </p>
          <p className="text-sm text-slate-500">Pending Reviews</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ borderColor: COLORS.light }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'text-white'
                  : 'text-slate-600'
              }`}
              style={filterType === type 
                ? { backgroundColor: COLORS.dark }
                : { backgroundColor: COLORS.lightest }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 ? (
        <div 
          className="bg-white rounded-xl border p-8 text-center"
          style={{ borderColor: COLORS.light }}
        >
          <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600">
            {searchQuery 
              ? 'No providers match your search'
              : filterType === 'pending' 
                ? 'No pending reviews'
                : filterType === 'completed'
                  ? 'No completed reviews'
                  : 'No providers found'}
          </p>
        </div>
      ) : (
        <>
          {/* Physicians Section */}
          {physicians.length > 0 && (
            <div 
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: COLORS.light }}
            >
              <div 
                className="px-6 py-4 border-b flex items-center gap-3"
                style={{ borderColor: COLORS.lightest, backgroundColor: COLORS.lightest + '40' }}
              >
                <Stethoscope className="w-5 h-5" style={{ color: COLORS.dark }} />
                <h2 className="font-semibold text-slate-900">
                  Physicians ({physicians.length})
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: COLORS.lightest }}>
                {physicians.map((provider) => (
                  <ProviderRow key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          )}

          {/* APCs Section */}
          {apcs.length > 0 && (
            <div 
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: COLORS.light }}
            >
              <div 
                className="px-6 py-4 border-b flex items-center gap-3"
                style={{ borderColor: COLORS.lightest, backgroundColor: COLORS.lightest + '40' }}
              >
                <UserCog className="w-5 h-5" style={{ color: COLORS.dark }} />
                <h2 className="font-semibold text-slate-900">
                  APCs ({apcs.length})
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: COLORS.lightest }}>
                {apcs.map((provider) => (
                  <ProviderRow key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
