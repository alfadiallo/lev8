'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Send, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RequestStudioAccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    affiliation: '',
    specialty: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim() || !formData.affiliation.trim()) {
      alert('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/studio/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--theme-background)' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--theme-primary-soft)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>Request Submitted!</h1>
          <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            We&apos;ve received your request to become a Studio creator. We&apos;ll review your application and get back to you soon.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--theme-primary)' }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--theme-background)' }}>
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--theme-primary)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>Request Studio Access</h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Become a content creator and contribute educational materials to the Elevate platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div 
            className="rounded-xl p-6 space-y-4"
            style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
          >
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Dr. Jane Smith"
                required
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Affiliation *
              </label>
              <input
                type="text"
                value={formData.affiliation}
                onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
                placeholder="Memorial Healthcare System"
                required
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Specialty
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="Emergency Medicine"
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Brief Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                placeholder="Tell us about your experience and what kind of content you'd like to create..."
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--theme-primary)' }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--theme-text-muted)' }}>
          By requesting access, you agree to our content guidelines and terms of service.
        </p>
      </div>
    </div>
  );
}
