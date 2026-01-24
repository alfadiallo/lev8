'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  Calendar,
  ClipboardList,
  FileText,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { 
  ComplianceSummary, 
  CategoryCompliance, 
  UpcomingDeadline,
  PRIORITY_CONFIG 
} from '@/lib/types/acgme';

export default function ExpectationsDashboard() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryCompliance[]>([]);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/expectations/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setSummary(data.summary);
      setCategoryData(data.categories || []);
      setDeadlines(data.deadlines || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="text-emerald-600" size={20} />;
      case 'at_risk':
        return <AlertTriangle className="text-amber-500" size={20} />;
      case 'non_compliant':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <HelpCircle className="text-gray-400" size={20} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
            <p className="mt-4 text-neutral-600">Loading compliance dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Expectations</h1>
          <p className="text-neutral-600">
            ACGME compliance dashboard for program leadership. Track requirements, manage evidence, and prepare for site visits.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Compliance Score */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-500">Compliance Score</h3>
              <TrendingUp className="text-[#7EC8E3]" size={20} />
            </div>
            <div className="text-3xl font-bold text-neutral-900">
              {summary?.compliance_percentage ?? '--'}%
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {summary?.compliant_count ?? 0} of {(summary?.total_requirements ?? 0) - (summary?.not_assessed_count ?? 0)} assessed
            </p>
          </div>

          {/* Compliant */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-500">Compliant</h3>
              <CheckCircle2 className="text-emerald-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {summary?.compliant_count ?? 0}
            </div>
            <p className="text-sm text-neutral-500 mt-1">requirements met</p>
          </div>

          {/* At Risk */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-500">At Risk</h3>
              <AlertTriangle className="text-amber-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {summary?.at_risk_count ?? 0}
            </div>
            <p className="text-sm text-neutral-500 mt-1">need attention</p>
          </div>

          {/* Non-Compliant */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-500">Non-Compliant</h3>
              <XCircle className="text-red-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-red-600">
              {summary?.non_compliant_count ?? 0}
            </div>
            <p className="text-sm text-neutral-500 mt-1">require action</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Compliance by Category</h2>
              <Link
                href="/expectations/requirements"
                className="text-[#7EC8E3] hover:text-[#5BA8C4] text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            {categoryData.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <BarChart3 size={48} className="mx-auto mb-4 text-neutral-300" />
                <p>No compliance data available yet.</p>
                <p className="text-sm mt-1">Run the requirements import script to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map((cat) => {
                  const total = cat.total - cat.not_assessed;
                  const percentage = total > 0 ? Math.round((cat.compliant / total) * 100) : 0;
                  
                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">{cat.category}</span>
                        <span className="text-sm text-neutral-500">
                          {cat.compliant}/{total} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                        {cat.compliant > 0 && (
                          <div 
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(cat.compliant / cat.total) * 100}%` }}
                          />
                        )}
                        {cat.at_risk > 0 && (
                          <div 
                            className="bg-amber-500 h-full"
                            style={{ width: `${(cat.at_risk / cat.total) * 100}%` }}
                          />
                        )}
                        {cat.non_compliant > 0 && (
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${(cat.non_compliant / cat.total) * 100}%` }}
                          />
                        )}
                        {cat.not_assessed > 0 && (
                          <div 
                            className="bg-neutral-200 h-full"
                            style={{ width: `${(cat.not_assessed / cat.total) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-neutral-500">Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-neutral-500">At Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-neutral-500">Non-Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                <span className="text-xs text-neutral-500">Not Assessed</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Upcoming Deadlines</h2>
              <Calendar className="text-[#7EC8E3]" size={20} />
            </div>

            {deadlines.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Calendar size={48} className="mx-auto mb-4 text-neutral-300" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deadlines.slice(0, 5).map((deadline, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {deadline.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {deadline.requirement_title}
                        </p>
                      </div>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded"
                        style={{
                          backgroundColor: PRIORITY_CONFIG[deadline.priority].bgColor,
                          color: PRIORITY_CONFIG[deadline.priority].color,
                        }}
                      >
                        {PRIORITY_CONFIG[deadline.priority].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                      <Calendar size={12} />
                      <span>
                        {new Date(deadline.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="capitalize">{deadline.deadline_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}

                {deadlines.length > 5 && (
                  <Link
                    href="/expectations/action-items"
                    className="block text-center text-sm text-[#7EC8E3] hover:text-[#5BA8C4] font-medium py-2"
                  >
                    View all {deadlines.length} deadlines
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Link
            href="/expectations/requirements"
            className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#7EC8E3]/10">
                <ClipboardList className="text-[#7EC8E3]" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-[#7EC8E3] transition-colors">
                  Browse Requirements
                </h3>
                <p className="text-sm text-neutral-500">View all ACGME requirements</p>
              </div>
            </div>
          </Link>

          <Link
            href="/expectations/action-items"
            className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-[#7EC8E3] transition-colors">
                  Action Items
                </h3>
                <p className="text-sm text-neutral-500">Manage remediation tasks</p>
              </div>
            </div>
          </Link>

          <Link
            href="/expectations/site-visits"
            className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100">
                <FileText className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-[#7EC8E3] transition-colors">
                  Site Visits
                </h3>
                <p className="text-sm text-neutral-500">Track visit history & outcomes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


