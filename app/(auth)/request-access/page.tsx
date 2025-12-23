'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  specialty?: string;
}

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    personalEmail: '',
    institutionalEmail: '',
    phone: '',
    requestedRole: 'resident',
    programId: '',
    medicalSchool: '',
    specialty: '',
    reason: '',
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch available programs
  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/access-requests/programs');
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error('[RequestAccess] Failed to fetch programs:', err);
      }
    }
    fetchPrograms();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal_email: formData.personalEmail,
          institutional_email: formData.institutionalEmail || null,
          full_name: formData.fullName,
          phone: formData.phone || null,
          requested_role: formData.requestedRole,
          program_id: formData.programId || null,
          medical_school: formData.medicalSchool || null,
          specialty: formData.specialty || null,
          reason: formData.reason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="p-8 rounded-2xl shadow-lg glass-panel text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle 
            className="w-16 h-16" 
            style={{ color: 'var(--theme-success, #22c55e)' }} 
          />
        </div>
        <h1 
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--theme-text)' }}
        >
          Request Submitted
        </h1>
        <p 
          className="mb-6"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Thank you for your interest in Elevate. We&apos;ll review your request and 
          get back to you within 24 hours.
        </p>
        <div 
          className="flex items-center justify-center gap-2 p-4 rounded-xl mb-6"
          style={{ 
            background: 'var(--theme-surface-solid)',
            border: '1px solid var(--theme-border-solid)'
          }}
        >
          <Clock className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          <span style={{ color: 'var(--theme-text)' }}>
            Expected response: Within 24 hours
          </span>
        </div>
        <Link href="/login">
          <Button variant="secondary" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl shadow-lg glass-panel max-w-lg">
      <h1 
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--theme-text)' }}
      >
        Request Access
      </h1>
      <p 
        className="text-sm mb-6"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Elevate is currently in closed beta. Fill out this form to request access 
        and we&apos;ll review your application.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          label="Full Name *"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Dr. Jane Smith"
          required
        />

        {/* Email Section */}
        <div className="space-y-4">
          <Input
            label="Personal Email *"
            type="email"
            name="personalEmail"
            value={formData.personalEmail}
            onChange={handleChange}
            placeholder="jane.smith@gmail.com"
            hint="This will be your primary login email"
            required
          />
          
          <Input
            label="Institutional Email"
            type="email"
            name="institutionalEmail"
            value={formData.institutionalEmail}
            onChange={handleChange}
            placeholder="jsmith@hospital.org"
            hint="Optional - helps us track participating institutions"
          />
        </div>

        {/* Phone */}
        <Input
          label="Phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
        />

        {/* Role Selection */}
        <div className="w-full">
          <label 
            htmlFor="requestedRole"
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--theme-text)' }}
          >
            I am a... *
          </label>
          <select
            id="requestedRole"
            name="requestedRole"
            value={formData.requestedRole}
            onChange={handleChange}
            required
            className="w-full rounded-xl border px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-4"
            style={{
              borderColor: 'var(--theme-border-solid)',
              backgroundColor: 'var(--theme-surface-solid)',
              color: 'var(--theme-text)',
            }}
          >
            <option value="resident">Resident</option>
            <option value="faculty">Faculty / Attending</option>
            <option value="program_director">Program Director</option>
          </select>
        </div>

        {/* Program Selection */}
        {programs.length > 0 && (
          <div className="w-full">
            <label 
              htmlFor="programId"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--theme-text)' }}
            >
              Program
            </label>
            <select
              id="programId"
              name="programId"
              value={formData.programId}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-4"
              style={{
                borderColor: 'var(--theme-border-solid)',
                backgroundColor: 'var(--theme-surface-solid)',
                color: 'var(--theme-text)',
              }}
            >
              <option value="">Select a program...</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} {program.specialty && `(${program.specialty})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Medical School - Only for residents */}
        {formData.requestedRole === 'resident' && (
          <Input
            label="Medical School"
            type="text"
            name="medicalSchool"
            value={formData.medicalSchool}
            onChange={handleChange}
            placeholder="e.g., University of Miami"
          />
        )}

        {/* Specialty */}
        <Input
          label="Specialty"
          type="text"
          name="specialty"
          value={formData.specialty}
          onChange={handleChange}
          placeholder="e.g., Emergency Medicine"
        />

        {/* Reason for Access */}
        <Textarea
          label="Why do you want access?"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Tell us a bit about yourself and why you're interested in Elevate..."
          rows={3}
        />

        {/* Error Display */}
        {error && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'var(--theme-error)',
              color: 'var(--theme-error)'
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={loading}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>

      {/* Footer */}
      <p 
        className="text-center text-sm mt-6"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Already have an account?{' '}
        <Link 
          href="/login" 
          className="font-medium transition-colors"
          style={{ color: 'var(--theme-primary)' }}
        >
          Login here
        </Link>
      </p>
    </div>
  );
}

