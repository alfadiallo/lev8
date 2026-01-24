'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EQPQIQForm, { FormData } from '@/components/forms/EQPQIQForm';

interface ResidentData {
  resident_id: string;
  full_name: string;
  graduation_year?: number;
}

interface ExistingAssessment extends FormData {
  id: string;
}

export default function SelfAssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [residentData, setResidentData] = useState<ResidentData | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [existingAssessment, setExistingAssessment] = useState<ExistingAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadResidentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadResidentData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch resident info
      const residentRes = await fetch('/api/users/me');
      if (!residentRes.ok) throw new Error('Failed to fetch resident data');
      
      const residentInfo = await residentRes.json();
      setResidentData(residentInfo);
      
      // Determine current period (PGY level + Fall/Spring)
      const period = determineCurrentPeriod();
      setCurrentPeriod(period);
      
      // Check for existing assessment
      const checkRes = await fetch(
        `/api/forms/check-submission?resident_id=${residentInfo.resident_id}&period_label=${encodeURIComponent(period)}&rater_type=self`
      );
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setExistingAssessment(checkData.data);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const determineCurrentPeriod = (): string => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    // Determine PGY level (this is simplified - you may need to fetch from class_id)
    // For now, we'll use a placeholder
    const pgyLevel = 'PGY-1'; // TODO: Calculate from graduation date
    
    // Determine Fall (July-December) or Spring (January-June)
    const period = month >= 7 ? 'Fall' : 'Spring';
    
    return `${pgyLevel} ${period}`;
  };

  const handleSubmit = async (formData: FormData) => {
    if (!residentData) {
      setError('Resident data not loaded');
      return;
    }
    
    try {
      const payload = {
        resident_id: residentData.resident_id,
        rater_type: 'self',
        period_label: currentPeriod,
        evaluation_date: new Date().toISOString().split('T')[0],
        ratings: {
          eq: {
            empathy: formData.eq_empathy,
            adaptability: formData.eq_adaptability,
            stress: formData.eq_stress,
            curiosity: formData.eq_curiosity,
            communication: formData.eq_communication,
          },
          iq: {
            knowledge: formData.iq_knowledge,
            analytical: formData.iq_analytical,
            learning: formData.iq_learning,
            flexibility: formData.iq_flexibility,
            performance: formData.iq_performance,
          },
          pq: {
            work_ethic: formData.pq_work_ethic,
            integrity: formData.pq_integrity,
            teachability: formData.pq_teachability,
            documentation: formData.pq_documentation,
            leadership: formData.pq_leadership,
          },
        },
        concerns_goals: formData.concerns_goals,
      };

      const method = existingAssessment ? 'PUT' : 'POST';
      const url = existingAssessment
        ? `/api/forms/structured-rating/${existingAssessment.id}`
        : '/api/forms/structured-rating';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      setSuccessMessage(
        existingAssessment
          ? 'Self-assessment updated successfully!'
          : 'Self-assessment submitted successfully!'
      );

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/forms/my-evaluations');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#05BFDB] mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !residentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-bold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Box */}
        {existingAssessment && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Note:</strong> You have already submitted a self-assessment for {currentPeriod}.
              You can update your responses below.
            </p>
          </div>
        )}

        {/* Form */}
        {residentData && (
          <EQPQIQForm
            residentId={residentData.resident_id}
            residentName={residentData.full_name}
            raterType="self"
            periodLabel={currentPeriod}
            onSubmit={handleSubmit}
            initialData={existingAssessment ?? undefined}
            isEditMode={!!existingAssessment}
          />
        )}

        {/* Historical Assessments Sidebar */}
        <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            Your Assessment History
          </h3>
          <p className="text-sm text-neutral-600">
            View your previous self-assessments in the{' '}
            <a
              href="/forms/my-evaluations"
              className="text-[#05BFDB] hover:underline"
            >
              My Evaluations
            </a>{' '}
            page.
          </p>
        </div>
      </div>
    </div>
  );
}


