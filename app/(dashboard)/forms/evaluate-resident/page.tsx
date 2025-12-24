'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EQPQIQForm, { FormData } from '@/components/forms/EQPQIQForm';

interface FacultyInfo {
  program_id: string;
  faculty_id: string;
}

interface Resident {
  id: string;
  full_name: string;
}

// ExistingEvaluation extends Partial<FormData> to allow passing to the form
interface ExistingEvaluation extends Partial<FormData> {
  id: string;
}

export default function EvaluateResidentPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [facultyData, setFacultyData] = useState<FacultyInfo | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [existingEvaluation, setExistingEvaluation] = useState<ExistingEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const determineCurrentPeriod = (): string => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const period = month >= 7 ? 'Fall' : 'Spring';
    return `PGY-1 ${period}`; // Default, user can change
  };

  const loadFacultyData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch faculty info
      const facultyRes = await fetch('/api/users/me');
      if (!facultyRes.ok) throw new Error('Failed to fetch faculty data');
      
      const facultyInfo = await facultyRes.json();
      setFacultyData(facultyInfo);
      
      // Fetch residents in program
      const residentsRes = await fetch(`/api/residents?program_id=${facultyInfo.program_id}`);
      if (!residentsRes.ok) throw new Error('Failed to fetch residents');
      
      const residentsData = await residentsRes.json();
      setResidents(residentsData);
      
      // Set default period
      setSelectedPeriod(determineCurrentPeriod());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkExistingEvaluation = useCallback(async () => {
    if (!facultyData) return;
    try {
      const checkRes = await fetch(
        `/api/forms/check-submission?resident_id=${selectedResident}&period_label=${encodeURIComponent(selectedPeriod)}&rater_type=faculty&faculty_id=${facultyData.faculty_id}`
      );
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setExistingEvaluation(checkData.data);
        } else {
          setExistingEvaluation(null);
        }
      }
    } catch (err) {
      console.error('Error checking existing evaluation:', err);
    }
  }, [selectedResident, selectedPeriod, facultyData]);

  useEffect(() => {
    if (user) {
      loadFacultyData();
    }
  }, [user, loadFacultyData]);

  useEffect(() => {
    if (selectedResident && selectedPeriod) {
      checkExistingEvaluation();
    }
  }, [selectedResident, selectedPeriod, checkExistingEvaluation]);

  const handleSubmit = async (formData: FormData) => {
    if (!facultyData) return;
    
    try {
      const payload = {
        resident_id: selectedResident,
        rater_type: 'faculty',
        faculty_id: facultyData.faculty_id,
        period_label: selectedPeriod,
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
        comments: formData.comments,
      };

      const method = existingEvaluation ? 'PUT' : 'POST';
      const url = existingEvaluation
        ? `/api/forms/structured-rating/${existingEvaluation.id}`
        : '/api/forms/structured-rating';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit evaluation');
      }

      setSuccessMessage(
        existingEvaluation
          ? 'Evaluation updated successfully!'
          : 'Evaluation submitted successfully!'
      );

      // Reset form after 2 seconds
      setTimeout(() => {
        setSelectedResident('');
        setExistingEvaluation(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit evaluation';
      setError(message);
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

  if (error && !facultyData) {
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

  const selectedResidentData = residents.find(r => r.id === selectedResident);

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

        {/* Resident & Period Selection */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Evaluate a Resident
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resident Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Resident <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedResident}
                onChange={(e) => setSelectedResident(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#05BFDB] focus:border-transparent"
                required
              >
                <option value="">Choose a resident...</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Evaluation Period <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#05BFDB] focus:border-transparent"
                required
              >
                <option value="PGY-1 Fall">PGY-1 Fall</option>
                <option value="PGY-1 Spring">PGY-1 Spring</option>
                <option value="PGY-2 Fall">PGY-2 Fall</option>
                <option value="PGY-2 Spring">PGY-2 Spring</option>
                <option value="PGY-3 Fall">PGY-3 Fall</option>
                <option value="PGY-3 Spring">PGY-3 Spring</option>
                <option value="PGY-4 Fall">PGY-4 Fall</option>
                <option value="PGY-4 Spring">PGY-4 Spring</option>
              </select>
            </div>
          </div>

          {/* Existing Evaluation Notice */}
          {existingEvaluation && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You have already evaluated this resident for {selectedPeriod}.
                You can update your evaluation below.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        {selectedResident && selectedResidentData && (
          <EQPQIQForm
            residentId={selectedResident}
            residentName={selectedResidentData.full_name}
            raterType="faculty"
            periodLabel={selectedPeriod}
            onSubmit={handleSubmit}
            initialData={existingEvaluation || undefined}
            isEditMode={!!existingEvaluation}
          />
        )}

        {!selectedResident && (
          <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-8 text-center">
            <p className="text-neutral-600">
              Please select a resident and period to begin the evaluation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


