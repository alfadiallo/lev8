'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import OverviewPane from '@/components/modules/understand/OverviewPane';

interface Resident {
  id: string;
  full_name: string;
  anon_code: string;
  pgy_level: number;
  graduation_year: number;
}

export default function TenantResidentsPage() {
  const { user } = useAuth();
  const { organization, department } = useTenant();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  useEffect(() => {
    async function fetchResidents() {
      if (!user) return;

      try {
        // Use V2 API with automatic tenant filtering from Referer
        const response = await fetch('/api/v2/residents');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch residents');
        }

        const data = await response.json();
        
        // Transform V2 API response to component format
        const transformedResidents: Resident[] = (data.residents || []).map((r: {
          id: string;
          fullName: string;
          anonCode: string;
          currentPgyLevel: number;
          graduationYear: number;
        }) => ({
          id: r.id,
          full_name: r.fullName,
          anon_code: r.anonCode,
          pgy_level: r.currentPgyLevel,
          graduation_year: r.graduationYear,
        }));

        setResidents(transformedResidents);
        
        // Select first resident by default
        if (transformedResidents.length > 0 && !selectedResident) {
          setSelectedResident(transformedResidents[0]);
        }
      } catch (err) {
        console.error('[ResidentsPage] Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only refetch when user changes, not when selection changes

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
        <OverviewPane 
          residentId={selectedResident.id}
          residentName={selectedResident.full_name}
          anonCode={selectedResident.anon_code}
          pgyLevel={selectedResident.pgy_level}
        />
      )}

      {error && (
        <div 
          className="text-center py-12 rounded-xl"
          style={{
            background: 'var(--theme-surface-solid)',
            border: '1px solid var(--theme-border-solid)',
          }}
        >
          <p style={{ color: 'var(--theme-error, #ef4444)' }}>
            {error}
          </p>
        </div>
      )}

      {!selectedResident && !error && residents.length === 0 && (
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
