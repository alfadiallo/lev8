'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Clock, Activity, Users } from 'lucide-react';
import RatingSliders, { RatingValues } from '@/components/pulsecheck/RatingSliders';
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

const initialRatings: RatingValues = {
  eq_empathy_rapport: null,
  eq_communication: null,
  eq_stress_management: null,
  eq_self_awareness: null,
  eq_adaptability: null,
  pq_reliability: null,
  pq_integrity: null,
  pq_teachability: null,
  pq_documentation: null,
  pq_leadership: null,
  iq_clinical_management: null,
  iq_evidence_based: null,
  iq_procedural: null,
};

export default function PulseCheckRatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login, isMedicalDirector } = usePulseCheckUserContext();
  
  const providerId = searchParams.get('provider');
  const cycleId = searchParams.get('cycle');
  const email = user?.email || searchParams.get('email') || '';

  const [provider, setProvider] = useState<Provider | null>(null);
  const [ratings, setRatings] = useState<RatingValues>(initialRatings);
  const [notes, setNotes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [goals, setGoals] = useState('');
  
  // Operational metrics
  const [metricLos, setMetricLos] = useState<number | null>(null);
  const [metricImagingUtil, setMetricImagingUtil] = useState<number | null>(null);
  const [metricImagingCt, setMetricImagingCt] = useState<number | null>(null);
  const [metricImagingUs, setMetricImagingUs] = useState<number | null>(null);
  const [metricImagingMri, setMetricImagingMri] = useState<number | null>(null);
  const [metricPph, setMetricPph] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  // Fetch provider data
  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/pulsecheck/providers/${providerId}`);
        if (!response.ok) throw new Error('Failed to fetch provider');
        const data = await response.json();
        setProvider(data.provider);

        // If there's existing rating data, load it
        if (data.existingRating) {
          setRatings({
            eq_empathy_rapport: data.existingRating.eq_empathy_rapport,
            eq_communication: data.existingRating.eq_communication,
            eq_stress_management: data.existingRating.eq_stress_management,
            eq_self_awareness: data.existingRating.eq_self_awareness,
            eq_adaptability: data.existingRating.eq_adaptability,
            pq_reliability: data.existingRating.pq_reliability,
            pq_integrity: data.existingRating.pq_integrity,
            pq_teachability: data.existingRating.pq_teachability,
            pq_documentation: data.existingRating.pq_documentation,
            pq_leadership: data.existingRating.pq_leadership,
            iq_clinical_management: data.existingRating.iq_clinical_management,
            iq_evidence_based: data.existingRating.iq_evidence_based,
            iq_procedural: data.existingRating.iq_procedural,
          });
          setNotes(data.existingRating.notes || '');
          setStrengths(data.existingRating.strengths || '');
          setAreasForImprovement(data.existingRating.areas_for_improvement || '');
          setGoals(data.existingRating.goals || '');
          // Load operational metrics
          setMetricLos(data.existingRating.metric_los ?? null);
          setMetricImagingUtil(data.existingRating.metric_imaging_util ?? null);
          setMetricImagingCt(data.existingRating.metric_imaging_ct ?? null);
          setMetricImagingUs(data.existingRating.metric_imaging_us ?? null);
          setMetricImagingMri(data.existingRating.metric_imaging_mri ?? null);
          setMetricPph(data.existingRating.metric_pph ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provider');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvider();
  }, [providerId]);

  const handleSubmit = async () => {
    if (!providerId || !user?.directorId) {
      setError('Missing required information');
      return;
    }

    // Check if all ratings are filled
    const allRated = Object.values(ratings).every(v => v !== null);
    if (!allRated) {
      setError('Please complete all ratings before submitting');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/pulsecheck/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          director_id: user.directorId,
          cycle_id: cycleId,
          ...ratings,
          notes,
          strengths,
          areas_for_improvement: areasForImprovement,
          goals,
          metric_los: metricLos,
          metric_imaging_util: metricImagingUtil,
          metric_imaging_ct: metricImagingCt,
          metric_imaging_us: metricImagingUs,
          metric_imaging_mri: metricImagingMri,
          metric_pph: metricPph,
          status: 'completed',
        }),
      });

      if (!response.ok) throw new Error('Failed to save rating');
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/pulsecheck/dashboard?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rating');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!providerId || !user?.directorId) {
      setError('Missing required information');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/pulsecheck/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          director_id: user.directorId,
          cycle_id: cycleId,
          ...ratings,
          notes,
          strengths,
          areas_for_improvement: areasForImprovement,
          goals,
          metric_los: metricLos,
          metric_imaging_util: metricImagingUtil,
          metric_imaging_ct: metricImagingCt,
          metric_imaging_us: metricImagingUs,
          metric_imaging_mri: metricImagingMri,
          metric_pph: metricPph,
          status: 'in_progress',
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion percentage
  const completedCount = Object.values(ratings).filter(v => v !== null).length;
  const totalCount = Object.keys(ratings).length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

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

  if (!providerId) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">No provider selected</p>
          <button
            onClick={() => router.push(`/pulsecheck/providers?email=${encodeURIComponent(email)}`)}
            className="mt-4 font-medium"
            style={{ color: COLORS.dark }}
          >
            View Providers
          </button>
        </div>
      </div>
    );
  }

  if (!isMedicalDirector) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">You do not have permission to rate providers</p>
          <button
            onClick={() => router.push(`/pulsecheck/dashboard?email=${encodeURIComponent(email)}`)}
            className="mt-4 font-medium"
            style={{ color: COLORS.dark }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/pulsecheck/providers?email=${encodeURIComponent(email)}`)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Providers
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Pulse Check Rating
        </h1>
        <p className="text-slate-600">
          Complete the EQ·PQ·IQ assessment for this provider
        </p>
      </div>

      {/* Provider Info - Sticky Header */}
      {provider && (
        <div 
          className="bg-white rounded-xl border p-4 mb-6 sticky top-0 z-10 shadow-sm"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: COLORS.dark }}
            >
              {provider.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 truncate">
                {provider.name}
                {provider.credential && (
                  <span className="text-slate-500 font-normal">, {provider.credential}</span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                >
                  {provider.provider_type === 'physician' ? 'Physician' : 'APC'}
                </span>
                <span className="text-sm text-slate-500">{provider.email}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-500">Completion</div>
                <div className="text-xl font-bold" style={{ color: COLORS.dark }}>
                  {completionPercent}%
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${completionPercent}%`, backgroundColor: COLORS.dark }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div 
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
        >
          <CheckCircle className="w-5 h-5" />
          <span>Rating saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
        >
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Operational Metrics Section - ABOVE EQ/PQ/IQ */}
      <div 
        className="mb-4 bg-white rounded-xl border p-4"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Operational Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* LOS */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
              <Clock className="w-3.5 h-3.5" />
              LOS (minutes)
            </label>
            <input
              type="number"
              value={metricLos ?? ''}
              onChange={(e) => setMetricLos(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 185"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
              min="0"
              step="1"
            />
          </div>
          
          {/* Imaging Utilization - CT, U/S, MRI */}
          <div className="col-span-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
              <Activity className="w-3.5 h-3.5" />
              Imaging Utilization (%)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">CT</label>
                <input
                  type="number"
                  value={metricImagingCt ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : null;
                    setMetricImagingCt(val);
                    // Auto-calculate average for storage
                    const total = (val ?? 0) + (metricImagingUs ?? 0) + (metricImagingMri ?? 0);
                    setMetricImagingUtil(total > 0 ? parseFloat((total / 3).toFixed(2)) : null);
                  }}
                  placeholder="CT %"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm"
                  style={{ borderColor: COLORS.light }}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">U/S</label>
                <input
                  type="number"
                  value={metricImagingUs ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : null;
                    setMetricImagingUs(val);
                    // Auto-calculate average for storage
                    const total = (metricImagingCt ?? 0) + (val ?? 0) + (metricImagingMri ?? 0);
                    setMetricImagingUtil(total > 0 ? parseFloat((total / 3).toFixed(2)) : null);
                  }}
                  placeholder="U/S %"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm"
                  style={{ borderColor: COLORS.light }}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">MRI</label>
                <input
                  type="number"
                  value={metricImagingMri ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : null;
                    setMetricImagingMri(val);
                    // Auto-calculate average for storage
                    const total = (metricImagingCt ?? 0) + (metricImagingUs ?? 0) + (val ?? 0);
                    setMetricImagingUtil(total > 0 ? parseFloat((total / 3).toFixed(2)) : null);
                  }}
                  placeholder="MRI %"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm"
                  style={{ borderColor: COLORS.light }}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          {/* PPH */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
              <Users className="w-3.5 h-3.5" />
              PPH (patients/hr)
            </label>
            <input
              type="number"
              value={metricPph ?? ''}
              onChange={(e) => setMetricPph(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="e.g., 1.85"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Rating Sliders (EQ/PQ/IQ) */}
      <RatingSliders 
        values={ratings} 
        onChange={setRatings}
      />

      {/* Additional Comments Section */}
      <div 
        className="mt-6 bg-white rounded-xl border p-6 space-y-4"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900">Additional Comments</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Strengths
          </label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="What does this provider do well?"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Areas for Improvement
          </label>
          <textarea
            value={areasForImprovement}
            onChange={(e) => setAreasForImprovement(e.target.value)}
            placeholder="What areas could this provider improve?"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Goals for Next Period
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Specific goals for the next review period"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            General Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other observations or comments"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving || completionPercent < 100}
          className="px-6 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: COLORS.dark }}
        >
          <CheckCircle className="w-4 h-4" />
          Submit Rating
        </button>
      </div>
    </div>
  );
}
