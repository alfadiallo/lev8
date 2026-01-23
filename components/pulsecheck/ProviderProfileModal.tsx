'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Award, Brain, Heart, Activity, Clock, BarChart3, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';

// Purple color palette
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  dark: '#7C3AED',
  darker: '#6D28D9',
};

interface RatingHistory {
  id: string;
  cycle_name: string;
  completed_at: string;
  eq_total: number | null;
  pq_total: number | null;
  iq_total: number | null;
  overall_total: number | null;
  metric_los: number | null;
  metric_imaging_util: number | null;
  metric_pph: number | null;
}

interface ProviderProfileModalProps {
  provider: {
    id: string;
    name: string;
    email: string;
    credential?: string | null;
    provider_type: string;
    status: 'pending' | 'completed' | 'not_rated';
    latestRating?: {
      eq: number;
      pq: number;
      iq: number;
      overall: number;
      metric_los?: number | null;
      metric_imaging_util?: number | null;
      metric_pph?: number | null;
    } | null;
  };
  onClose: () => void;
}

export default function ProviderProfileModal({ provider, onClose }: ProviderProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [ratingHistory, setRatingHistory] = useState<RatingHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch rating history when provider changes or history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && ratingHistory.length === 0 && provider?.id) {
      setIsLoadingHistory(true);
      fetch(`/api/pulsecheck/providers/${provider.id}`)
        .then(res => res.json())
        .then(data => {
          setRatingHistory(data.ratingHistory || []);
        })
        .catch(console.error)
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, provider?.id, ratingHistory.length]);

  if (!provider) return null;

  const getScoreColor = (score: number | undefined | null) => {
    if (score === undefined || score === null) return 'text-slate-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatScore = (score: number | undefined | null) => {
    return score !== undefined && score !== null ? score.toFixed(1) : '-';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative h-16 bg-gradient-to-r from-purple-600 to-indigo-600">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar overlapping header */}
        <div className="relative px-5">
          <div className="absolute -top-8 left-5">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center text-xl font-bold text-purple-600">
              {provider.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 px-5 pb-5">
          {/* Provider Info Row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {provider.name}
                {provider.credential && (
                  <span className="text-slate-500 font-normal ml-1">, {provider.credential}</span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  provider.provider_type === 'physician' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {provider.provider_type === 'physician' ? 'Physician' : 'APC'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {provider.email}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              provider.status === 'completed' ? 'bg-green-100 text-green-700' :
              provider.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {provider.status === 'completed' ? 'Completed' :
               provider.status === 'pending' ? 'Pending' : 'Not Started'}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {/* Current Tab Content */}
          {activeTab === 'current' && (
            <>
              {/* EQ/PQ/IQ Scores */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                    <Heart className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(provider.latestRating?.eq)}`}>
                    {formatScore(provider.latestRating?.eq)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase">EQ</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(provider.latestRating?.pq)}`}>
                    {formatScore(provider.latestRating?.pq)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase">PQ</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-1">
                    <Brain className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(provider.latestRating?.iq)}`}>
                    {formatScore(provider.latestRating?.iq)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase">IQ</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-1">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(provider.latestRating?.overall)}`}>
                    {formatScore(provider.latestRating?.overall)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase">Overall</div>
                </div>
              </div>

              {/* Operational Metrics */}
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mb-3">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Operational Metrics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">LOS</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {provider.latestRating?.metric_los ?? '-'}
                    </div>
                    <div className="text-[9px] text-slate-400">min</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                      <BarChart3 className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Imaging</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {provider.latestRating?.metric_imaging_util != null 
                        ? `${provider.latestRating.metric_imaging_util}%` 
                        : '-'}
                    </div>
                    <div className="text-[9px] text-slate-400">util</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-medium">PPH</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {provider.latestRating?.metric_pph != null 
                        ? provider.latestRating.metric_pph.toFixed(2) 
                        : '-'}
                    </div>
                    <div className="text-[9px] text-slate-400">pts/hr</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="max-h-64 overflow-y-auto">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                </div>
              ) : ratingHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No historical ratings found
                </div>
              ) : (
                <div className="space-y-2">
                  {ratingHistory.map((rating) => (
                    <div 
                      key={rating.id}
                      className="bg-slate-50 rounded-lg border border-slate-100 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {rating.cycle_name || formatDate(rating.completed_at)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(rating.completed_at)}
                        </span>
                      </div>
                      
                      {/* Scores Row */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-green-500" />
                          <span className={`font-medium ${getScoreColor(rating.eq_total)}`}>
                            {formatScore(rating.eq_total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-indigo-500" />
                          <span className={`font-medium ${getScoreColor(rating.pq_total)}`}>
                            {formatScore(rating.pq_total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-amber-500" />
                          <span className={`font-medium ${getScoreColor(rating.iq_total)}`}>
                            {formatScore(rating.iq_total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-slate-400">Overall:</span>
                          <span className={`font-bold ${getScoreColor(rating.overall_total)}`}>
                            {formatScore(rating.overall_total)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Metrics Row */}
                      {(rating.metric_los || rating.metric_imaging_util || rating.metric_pph) && (
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                          {rating.metric_los && (
                            <span>LOS: {rating.metric_los}min</span>
                          )}
                          {rating.metric_imaging_util != null && (
                            <span>Imaging: {rating.metric_imaging_util}%</span>
                          )}
                          {rating.metric_pph != null && (
                            <span>PPH: {rating.metric_pph.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: COLORS.dark }}
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
