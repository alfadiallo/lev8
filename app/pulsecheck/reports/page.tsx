'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  Users, 
  UserCog,
  Activity,
  TrendingUp,
  Heart,
  Award,
  Brain,
  ChevronDown,
  ChevronRight,
  X,
  Send,
  Bell,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
  Mic
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

interface AverageScores {
  eq: number;
  pq: number;
  iq: number;
  overall: number;
}

interface ProviderStats {
  id: string;
  name: string;
  email: string;
  credential: string | null;
  provider_type: string;
  primary_department_id: string;
  primary_director_id: string | null;
  status: 'pending' | 'completed' | 'not_rated';
  completedRatings: number;
  latestRating: {
    eq: number;
    pq: number;
    iq: number;
    overall: number;
    completed_at: string;
  } | null;
}

interface DepartmentStats {
  id: string;
  name: string;
  site_id: string;
  providerCount: number;
  directorCount: number;
  completedRatings: number;
  completionRate: number;
  averageScores: AverageScores | null;
  providers: ProviderStats[];
}

interface SiteStats {
  id: string;
  name: string;
  region: string | null;
  departmentCount: number;
  providerCount: number;
  directorCount: number;
  completedRatings: number;
  completionRate: number;
  averageScores: AverageScores | null;
  departments: DepartmentStats[];
}

interface DirectorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OverallStats {
  totalSites: number;
  totalDepartments: number;
  totalDirectors: number;
  totalProviders: number;
  totalCompletedRatings: number;
  overallCompletionRate: number;
  averageScores: AverageScores | null;
}

interface ReportsData {
  sites: SiteStats[];
  departments: DepartmentStats[];
  overall: OverallStats;
  directors: DirectorInfo[];
}

export default function PulseCheckReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    user, 
    isLoading: isUserLoading, 
    isAuthenticated, 
    login, 
    isRegionalDirector, 
    isAdminAssistant 
  } = usePulseCheckUserContext();

  const [data, setData] = useState<ReportsData | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Expandable state
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  // Share popup state
  const [showSharePopup, setShowSharePopup] = useState(false);
  const sharePopupRef = useRef<HTMLDivElement>(null);
  
  // Voice memo modal state
  const [showVoiceMemoModal, setShowVoiceMemoModal] = useState(false);

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  // Fetch reports data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = selectedSite 
          ? `/api/pulsecheck/reports?site_id=${selectedSite}`
          : '/api/pulsecheck/reports';
        
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load reports');
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSite]);

  // Close share popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sharePopupRef.current && !sharePopupRef.current.contains(event.target as Node)) {
        setShowSharePopup(false);
      }
    };

    if (showSharePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSharePopup]);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  const formatScore = (score: number | undefined | null) => {
    return score !== undefined && score !== null ? score.toFixed(1) : '-';
  };

  const getScoreColor = (score: number | undefined | null) => {
    if (score === undefined || score === null) return 'text-slate-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const toggleSite = (siteId: string) => {
    setExpandedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  };

  const toggleDepartment = (deptId: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleShareAction = (action: string) => {
    // For now, these will open mailto: links or download CSV
    // In a full implementation, these would call API endpoints
    switch (action) {
      case 'export':
        // Generate CSV and download it
        if (data) {
          const csv = generateCSV();
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pulsecheck_report.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        }
        break;
      case 'reminders':
        // Open mailto with reminder template
        if (data?.directors) {
          const emails = data.directors.map(d => d.email).join(',');
          const subject = encodeURIComponent('Pulse Check Reminder: Complete Your Provider Reviews');
          const body = encodeURIComponent('This is a reminder to complete your pending provider reviews in Pulse Check.\n\nPlease log in to complete your evaluations.');
          window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
        }
        break;
      case 'summary':
        // Open mailto with summary
        if (data?.directors) {
          const emails = data.directors.filter(d => d.role === 'regional_director').map(d => d.email).join(',');
          const subject = encodeURIComponent('Pulse Check Summary Report');
          const body = encodeURIComponent(`Pulse Check Summary\n\nTotal Sites: ${data.overall.totalSites}\nTotal Providers: ${data.overall.totalProviders}\nCompletion Rate: ${data.overall.overallCompletionRate}%\n\nPlease log in for detailed reports.`);
          window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
        }
        break;
    }
    setShowSharePopup(false);
  };

  const generateCSV = () => {
    if (!data) return '';
    const rows = [
      ['Site', 'Department', 'Provider', 'Type', 'Status', 'EQ', 'PQ', 'IQ', 'Overall'],
    ];
    
    data.sites.forEach(site => {
      site.departments?.forEach(dept => {
        dept.providers?.forEach(provider => {
          rows.push([
            site.name,
            dept.name,
            provider.name,
            provider.provider_type,
            provider.status,
            formatScore(provider.latestRating?.eq),
            formatScore(provider.latestRating?.pq),
            formatScore(provider.latestRating?.iq),
            formatScore(provider.latestRating?.overall),
          ]);
        });
      });
    });
    
    return rows.map(row => row.join(',')).join('\n');
  };

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

  if (!isRegionalDirector && !isAdminAssistant) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.dark }} />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">
          You do not have permission to view reports.
        </p>
        <button
          onClick={() => router.push(`/pulsecheck/dashboard${emailParam}`)}
          className="text-white px-6 py-2 rounded-lg font-medium"
          style={{ backgroundColor: COLORS.dark }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push(`/pulsecheck/dashboard${emailParam}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.name ? `Welcome ${user.name}` : 'Reports & Analytics'}
          </h1>
          <p className="text-slate-600">
            {user?.healthsystemName || 'Overview of Pulse Check performance across all sites'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Memo Button */}
          <button
            onClick={() => setShowVoiceMemoModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-slate-50"
            style={{ borderColor: COLORS.light, color: COLORS.darker }}
          >
            <Mic className="w-4 h-4" />
            Voice Memo
          </button>
          
          {/* Share Button */}
          <div className="relative" ref={sharePopupRef}>
            <button
              onClick={() => setShowSharePopup(!showSharePopup)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            {/* Share Popup */}
            {showSharePopup && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border z-50" style={{ borderColor: COLORS.light }}>
                <div className="p-4 border-b" style={{ borderColor: COLORS.lightest }}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Share Options</h4>
                    <button
                      onClick={() => setShowSharePopup(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => handleShareAction('export')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.lightest }}>
                      <FileText className="w-4 h-4" style={{ color: COLORS.dark }} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Export Report</p>
                      <p className="text-xs text-slate-500">Download CSV with all provider data</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleShareAction('reminders')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                      <Bell className="w-4 h-4" style={{ color: '#D97706' }} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Send Reminders</p>
                      <p className="text-xs text-slate-500">Email directors with pending reviews</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleShareAction('summary')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DCFCE7' }}>
                      <Send className="w-4 h-4" style={{ color: '#16A34A' }} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Email Summary</p>
                      <p className="text-xs text-slate-500">Send summary to leadership</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Sites</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{data.overall.totalSites}</p>
          </div>
          
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Departments</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{data.overall.totalDepartments}</p>
          </div>
          
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Directors</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{data.overall.totalDirectors}</p>
          </div>
          
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Providers</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{data.overall.totalProviders}</p>
          </div>
          
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{data.overall.totalCompletedRatings}</p>
          </div>
          
          <div 
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: COLORS.light }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Completion</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.dark }}>
              {data.overall.overallCompletionRate}%
            </p>
          </div>
        </div>
      )}

      {/* Average Scores Card */}
      {data?.overall.averageScores && (
        <div 
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: COLORS.light }}
        >
          <h3 className="font-semibold text-slate-900 mb-4">Overall Average Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#10B98120' }}
              >
                <Heart className="w-6 h-6" style={{ color: '#10B981' }} />
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(data.overall.averageScores.eq)}`}>
                {formatScore(data.overall.averageScores.eq)}
              </p>
              <p className="text-sm text-slate-500">Avg EQ</p>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#6366F120' }}
              >
                <Award className="w-6 h-6" style={{ color: '#6366F1' }} />
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(data.overall.averageScores.pq)}`}>
                {formatScore(data.overall.averageScores.pq)}
              </p>
              <p className="text-sm text-slate-500">Avg PQ</p>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#F59E0B20' }}
              >
                <Brain className="w-6 h-6" style={{ color: '#F59E0B' }} />
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(data.overall.averageScores.iq)}`}>
                {formatScore(data.overall.averageScores.iq)}
              </p>
              <p className="text-sm text-slate-500">Avg IQ</p>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: COLORS.lightest }}
              >
                <Activity className="w-6 h-6" style={{ color: COLORS.dark }} />
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(data.overall.averageScores.overall)}`}>
                {formatScore(data.overall.averageScores.overall)}
              </p>
              <p className="text-sm text-slate-500">Overall</p>
            </div>
          </div>
        </div>
      )}

      {/* Sites Table with Expandable Rows */}
      {data && (
        <div 
          className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: COLORS.light }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.lightest }}>
            <h3 className="font-semibold text-slate-900">Sites Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Click on a site to view departments and providers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-sm text-slate-600">
                  <th className="px-6 py-3 font-medium">Site</th>
                  <th className="px-6 py-3 font-medium text-center">Departments</th>
                  <th className="px-6 py-3 font-medium text-center">Providers</th>
                  <th className="px-6 py-3 font-medium text-center">Completed</th>
                  <th className="px-6 py-3 font-medium text-center">Rate</th>
                  <th className="px-6 py-3 font-medium text-center">EQ</th>
                  <th className="px-6 py-3 font-medium text-center">PQ</th>
                  <th className="px-6 py-3 font-medium text-center">IQ</th>
                  <th className="px-6 py-3 font-medium text-center">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
                {data.sites.map((site) => (
                  <Fragment key={site.id}>
                    {/* Site Row */}
                    <tr 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleSite(site.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {expandedSites.has(site.id) ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{site.name}</p>
                            {site.region && (
                              <p className="text-sm text-slate-500">{site.region}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{site.departmentCount}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{site.providerCount}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{site.completedRatings}</td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className={`font-medium ${
                            site.completionRate >= 80 ? 'text-green-600' :
                            site.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}
                        >
                          {site.completionRate}%
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-center font-medium ${getScoreColor(site.averageScores?.eq)}`}>
                        {formatScore(site.averageScores?.eq)}
                      </td>
                      <td className={`px-6 py-4 text-center font-medium ${getScoreColor(site.averageScores?.pq)}`}>
                        {formatScore(site.averageScores?.pq)}
                      </td>
                      <td className={`px-6 py-4 text-center font-medium ${getScoreColor(site.averageScores?.iq)}`}>
                        {formatScore(site.averageScores?.iq)}
                      </td>
                      <td className={`px-6 py-4 text-center font-medium ${getScoreColor(site.averageScores?.overall)}`}>
                        {formatScore(site.averageScores?.overall)}
                      </td>
                    </tr>
                    
                    {/* Expanded Providers - directly under site (no department level) */}
                    {expandedSites.has(site.id) && site.departments?.flatMap((dept) => 
                      dept.providers?.map((provider) => (
                        <tr 
                          key={provider.id}
                          className="bg-slate-50/50"
                        >
                          <td className="px-6 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(provider.status)}
                              <div>
                                <span className="text-sm font-medium text-slate-700">
                                  {provider.name}
                                  {provider.credential && (
                                    <span className="text-slate-500 font-normal">, {provider.credential}</span>
                                  )}
                                </span>
                                <p className="text-xs text-slate-400">{provider.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center text-slate-500 text-sm">
                            {dept.name}
                          </td>
                          <td className="px-6 py-3 text-center text-slate-400 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              provider.provider_type === 'physician' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {provider.provider_type === 'physician' ? 'Physician' : 'APC'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-slate-500 text-sm">
                            {provider.completedRatings}
                          </td>
                          <td className="px-6 py-3 text-center text-sm">
                            <span className={`capitalize px-2 py-0.5 rounded-full text-xs ${
                              provider.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : provider.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {provider.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-center text-sm ${getScoreColor(provider.latestRating?.eq)}`}>
                            {formatScore(provider.latestRating?.eq)}
                          </td>
                          <td className={`px-6 py-3 text-center text-sm ${getScoreColor(provider.latestRating?.pq)}`}>
                            {formatScore(provider.latestRating?.pq)}
                          </td>
                          <td className={`px-6 py-3 text-center text-sm font-medium ${getScoreColor(provider.latestRating?.overall)}`}>
                            {formatScore(provider.latestRating?.overall)}
                          </td>
                        </tr>
                      ))
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {data.sites.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No sites found
            </div>
          )}
        </div>
      )}

      {/* Voice Memo Confirmation Modal */}
      {showVoiceMemoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.lightest }}>
                <Mic className="w-8 h-8" style={{ color: COLORS.dark }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Record Voice Memo</h3>
              <p className="text-slate-600 text-center mb-6">
                Record a voice note and your memo will be transcribed and saved. Provide sufficient detail so it can be linked appropriately. Recordings and mappings will be visible in Voice Memos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVoiceMemoModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // In a full implementation, this would start recording
                    alert('Voice recording feature coming soon!');
                    setShowVoiceMemoModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.dark }}
                >
                  <Mic className="w-4 h-4" />
                  Start Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
