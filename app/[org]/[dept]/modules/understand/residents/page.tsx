'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import OverviewPane from '@/components/modules/understand/OverviewPane';

interface Resident {
  id: string;
  full_name: string;
  pgy_level: number;
  graduation_year: number;
  class_id: string;
}

export default function TenantResidentsPage() {
  const { user } = useAuth();
  const { organization, department } = useTenant();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  useEffect(() => {
    async function fetchResidents() {
      if (!user) return;

      try {
        // Fetch residents with their user profile info
        const { data, error } = await supabase
          .from('residents')
          .select(`
            id,
            class_id,
            user_id,
            user_profiles!residents_user_id_fkey (
              full_name
            ),
            classes!residents_class_id_fkey (
              graduation_year
            )
          `)
          .order('id');

        if (error) {
          console.error('[ResidentsPage] Error fetching residents:', error);
          return;
        }

        // Transform data
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;

        const transformedResidents = (data || []).map((r: Record<string, unknown>) => {
          const userProfile = r.user_profiles as { full_name: string } | null;
          const classInfo = r.classes as { graduation_year: number } | null;
          const gradYear = classInfo?.graduation_year || currentYear + 3;
          const pgyLevel = Math.max(1, Math.min(5, gradYear - academicYear));

          return {
            id: r.id as string,
            full_name: userProfile?.full_name || 'Unknown',
            pgy_level: pgyLevel,
            graduation_year: gradYear,
            class_id: r.class_id as string,
          };
        });

        setResidents(transformedResidents);
        
        // Select first resident by default
        if (transformedResidents.length > 0 && !selectedResident) {
          setSelectedResident(transformedResidents[0]);
        }
      } catch (err) {
        console.error('[ResidentsPage] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResidents();
  }, [user, selectedResident]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Resident Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          {organization?.name} - {department?.name}
        </p>
      </div>

      {/* Resident Selection */}
      <div 
        className="rounded-xl p-4"
        style={{
          background: 'var(--theme-surface-solid)',
          border: '1px solid var(--theme-border-solid)',
        }}
      >
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Select Resident
        </label>
        <select
          value={selectedResident?.id || ''}
          onChange={(e) => {
            const resident = residents.find(r => r.id === e.target.value);
            setSelectedResident(resident || null);
          }}
          className="w-full md:w-64 px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--theme-border-solid)',
            color: 'var(--theme-text)',
          }}
        >
          <option value="">Select a resident...</option>
          {residents.map((resident) => (
            <option key={resident.id} value={resident.id}>
              {resident.full_name} (PGY-{resident.pgy_level})
            </option>
          ))}
        </select>
      </div>

      {/* Overview Pane */}
      {selectedResident && (
        <OverviewPane residentId={selectedResident.id} />
      )}

      {!selectedResident && residents.length === 0 && (
        <div 
          className="text-center py-12 rounded-xl"
          style={{
            background: 'var(--theme-surface-solid)',
            border: '1px solid var(--theme-border-solid)',
          }}
        >
          <p style={{ color: 'var(--theme-text-muted)' }}>
            No residents found in this program.
          </p>
        </div>
      )}
    </div>
  );
}
