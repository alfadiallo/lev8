'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { SiteVisit, VisitType, VisitOutcome } from '@/lib/types/acgme';

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  initial: 'Initial Accreditation',
  continued: 'Continued Accreditation',
  focused: 'Focused Site Visit',
  self_study: 'Self-Study',
};

const OUTCOME_CONFIG: Record<VisitOutcome, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  continued_accreditation: {
    label: 'Continued Accreditation',
    color: '#059669',
    bgColor: '#D1FAE5',
    icon: <CheckCircle2 size={16} />,
  },
  continued_with_warning: {
    label: 'Continued with Warning',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: <AlertTriangle size={16} />,
  },
  probation: {
    label: 'Probation',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: <XCircle size={16} />,
  },
  withdrawal: {
    label: 'Withdrawal',
    color: '#7F1D1D',
    bgColor: '#FEE2E2',
    icon: <XCircle size={16} />,
  },
  pending: {
    label: 'Pending',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: <Clock size={16} />,
  },
};

export default function SiteVisitsPage() {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteVisits();
  }, []);

  const fetchSiteVisits = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/expectations/site-visits');
      if (!response.ok) {
        throw new Error('Failed to fetch site visits');
      }

      const data = await response.json();
      setSiteVisits(data.siteVisits || []);
    } catch (err) {
      console.error('Site visits fetch error:', err);
      setError('Failed to load site visits');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
            <p className="mt-4 text-neutral-600">Loading site visits...</p>
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
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
            <Link href="/expectations" className="hover:text-[#7EC8E3]">Expectations</Link>
            <ChevronRight size={14} />
            <span>Site Visits</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Site Visits</h1>
              <p className="text-neutral-600">
                Track ACGME site visit history, outcomes, and citations.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors font-medium">
              <Plus size={18} />
              Record Site Visit
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Next Scheduled Visit */}
        {siteVisits.some(v => v.outcome === 'pending' || !v.outcome) && (
          <div className="bg-gradient-to-r from-[#7EC8E3]/10 to-[#7EC8E3]/5 rounded-lg border border-[#7EC8E3]/20 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#7EC8E3]/20">
                <Calendar className="text-[#7EC8E3]" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Upcoming Site Visit</h3>
                {siteVisits.filter(v => v.outcome === 'pending' || !v.outcome)[0] && (
                  <p className="text-sm text-neutral-600">
                    {VISIT_TYPE_LABELS[siteVisits.filter(v => v.outcome === 'pending' || !v.outcome)[0].visit_type]} scheduled for{' '}
                    {new Date(siteVisits.filter(v => v.outcome === 'pending' || !v.outcome)[0].visit_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Site Visits List */}
        {siteVisits.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No site visits recorded</h3>
            <p className="text-neutral-600 mb-4">
              Start tracking your ACGME site visits and outcomes.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors font-medium">
              <Plus size={18} />
              Record First Site Visit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {siteVisits
              .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
              .map((visit) => {
                const outcomeConfig = visit.outcome ? OUTCOME_CONFIG[visit.outcome] : OUTCOME_CONFIG.pending;
                const isExpanded = expandedVisit === visit.id;

                return (
                  <div
                    key={visit.id}
                    className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
                  >
                    {/* Visit Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: outcomeConfig.bgColor }}
                          >
                            <span style={{ color: outcomeConfig.color }}>
                              {outcomeConfig.icon}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">
                              {VISIT_TYPE_LABELS[visit.visit_type]}
                            </h3>
                            <p className="text-sm text-neutral-500">
                              {new Date(visit.visit_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Outcome Badge */}
                          <span
                            className="px-3 py-1 text-sm font-medium rounded-full"
                            style={{
                              backgroundColor: outcomeConfig.bgColor,
                              color: outcomeConfig.color,
                            }}
                          >
                            {outcomeConfig.label}
                          </span>

                          {/* Citations Count */}
                          {visit.citations_count > 0 && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                              {visit.citations_count} citation{visit.citations_count !== 1 ? 's' : ''}
                            </span>
                          )}

                          <ChevronRight
                            size={20}
                            className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-neutral-100 p-4 bg-neutral-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            {/* Commendations */}
                            {visit.commendations && visit.commendations.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                  Commendations
                                </h4>
                                <ul className="space-y-1">
                                  {visit.commendations.map((item, idx) => (
                                    <li key={idx} className="text-sm text-neutral-600 flex items-start gap-2">
                                      <span className="text-emerald-500 mt-1">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Areas for Improvement */}
                            {visit.areas_for_improvement && visit.areas_for_improvement.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                                  <AlertTriangle size={16} className="text-amber-500" />
                                  Areas for Improvement
                                </h4>
                                <ul className="space-y-1">
                                  {visit.areas_for_improvement.map((item, idx) => (
                                    <li key={idx} className="text-sm text-neutral-600 flex items-start gap-2">
                                      <span className="text-amber-500 mt-1">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            {/* Next Visit */}
                            {visit.next_visit_date && (
                              <div className="p-3 bg-white rounded-lg border border-neutral-200">
                                <h4 className="text-sm font-semibold text-neutral-700 mb-1">
                                  Next Scheduled Visit
                                </h4>
                                <p className="text-sm text-neutral-600">
                                  {new Date(visit.next_visit_date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            )}

                            {/* Notes */}
                            {visit.notes && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Notes
                                </h4>
                                <p className="text-sm text-neutral-600">{visit.notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              {visit.report_file_path && (
                                <button className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                                  <Download size={16} />
                                  Download Report
                                </button>
                              )}
                              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                                <Eye size={16} />
                                View Citations
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Summary Stats */}
        {siteVisits.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
              <div className="text-2xl font-bold text-neutral-900">{siteVisits.length}</div>
              <div className="text-sm text-neutral-500">Total Visits</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {siteVisits.filter(v => v.outcome === 'continued_accreditation').length}
              </div>
              <div className="text-sm text-neutral-500">Successful</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {siteVisits.filter(v => v.outcome === 'continued_with_warning').length}
              </div>
              <div className="text-sm text-neutral-500">With Warnings</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
              <div className="text-2xl font-bold text-neutral-900">
                {siteVisits.reduce((sum, v) => sum + (v.citations_count || 0), 0)}
              </div>
              <div className="text-sm text-neutral-500">Total Citations</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


