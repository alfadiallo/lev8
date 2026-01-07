'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { X } from 'lucide-react';
import { 
  calculatePGYLevel, 
  formatPGYLevel, 
  getGraduationYearForPGY,
  getAcademicYearString,
  getActivePGYLevels
} from '@/lib/utils/pgy-calculator';

interface ResidentWithPGY {
  id: string;
  full_name: string;
  anon_code: string;
  graduation_year: number;
  class_name: string;
  current_pgy_level: number;
}

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export default function CreateSessionModal({ onClose, onCreated }: CreateSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; graduation_year: number; name: string }>>([]);
  const [residents, setResidents] = useState<ResidentWithPGY[]>([]);
  const [selectedPGY, setSelectedPGY] = useState<number | 'all'>(3); // Default to PGY-3
  
  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'Spring' as 'Fall' | 'Spring',
    academic_year: getAcademicYearString(),
    duration_minutes: 60,
    title: '',
  });

  useEffect(() => {
    fetchClassesAndResidents();
  }, []);

  const fetchClassesAndResidents = async () => {
    try {
      // Fetch classes (include ALL classes, not just active)
      const { data: classData, error: classError } = await supabaseClient
        .from('classes')
        .select('id, graduation_year, name')
        .order('graduation_year', { ascending: true });

      console.log('[Understand] Classes fetched:', classData?.length || 0, classError?.message || 'OK');
      if (classData) {
        setClasses(classData);
      }

      // Try to fetch residents with PGY info using the view
      // Filter to only active classes (graduation_year >= current year)
      let { data: residentData, error: viewError } = await supabaseClient
        .from('residents_with_pgy')
        .select('id, full_name, anon_code, graduation_year, class_name, current_pgy_level')
        .gte('graduation_year', 2026) // Only current residents (not graduated)
        .order('current_pgy_level', { ascending: false });
      
      console.log('[Understand] View query result:', residentData?.length || 0, 'residents', viewError?.message || 'OK');

      // Fallback: if view doesn't exist, query residents directly with class join
      if (viewError || !residentData || residentData.length === 0) {
        console.log('[Understand] View not available, using fallback query');
        
        const { data: fallbackData } = await supabaseClient
          .from('residents')
          .select(`
            id,
            anon_code,
            class_id,
            classes:class_id (
              graduation_year,
              name
            )
          `)
          .order('anon_code', { ascending: true });

        if (fallbackData && fallbackData.length > 0) {
          // Get user profiles for names
          const { data: profileData } = await supabaseClient
            .from('user_profiles')
            .select('id, full_name, email');

          // Create a map of user_id to profile
          const { data: residentUserData } = await supabaseClient
            .from('residents')
            .select('id, user_id');
          
          const userIdMap = new Map(residentUserData?.map(r => [r.id, r.user_id]) || []);
          const profileMap = new Map(profileData?.map(p => [p.id, p]) || []);

          residentData = fallbackData.map(r => {
            // Handle nested class data safely
            const classesRaw = r.classes as unknown;
            let graduationYear = 0;
            let className = '';
            
            if (classesRaw && typeof classesRaw === 'object' && !Array.isArray(classesRaw)) {
              const classObj = classesRaw as Record<string, unknown>;
              graduationYear = (classObj.graduation_year as number) || 0;
              className = (classObj.name as string) || '';
            }
            
            const userId = userIdMap.get(r.id);
            const profile = userId ? profileMap.get(userId) : null;
            
            return {
              id: r.id,
              full_name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
              anon_code: r.anon_code || '',
              graduation_year: graduationYear,
              class_name: className || `Class ${r.class_id?.slice(-2) || '??'}`,
              current_pgy_level: graduationYear ? calculatePGYLevel(graduationYear) : 0,
            };
          });
        }
      }

      if (residentData) {
        setResidents(residentData as ResidentWithPGY[]);
        console.log('[Understand] Loaded residents:', residentData.length);
      }
    } catch (err) {
      console.error('[Understand] Error fetching data:', err);
    }
  };

  // Calculate which class corresponds to selected PGY for the session date
  const getTargetGraduationYear = () => {
    if (selectedPGY === 'all') return null;
    const sessionDate = new Date(formData.session_date);
    return getGraduationYearForPGY(selectedPGY, sessionDate);
  };

  // Filter residents by selected PGY level
  const filteredResidents = residents.filter(r => {
    if (selectedPGY === 'all') return true;
    const sessionDate = new Date(formData.session_date);
    const pgy = calculatePGYLevel(r.graduation_year, sessionDate);
    return pgy === selectedPGY;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user?.user?.id) throw new Error('Not authenticated');

      // Get program_id
      const { data: program } = await supabaseClient
        .from('programs')
        .select('id')
        .limit(1)
        .single();

      if (!program) throw new Error('No program found');

      // Create the session
      const { data, error } = await supabaseClient
        .from('ccc_sessions')
        .insert({
          program_id: program.id,
          session_date: formData.session_date,
          session_type: formData.session_type,
          academic_year: formData.academic_year,
          duration_minutes: formData.duration_minutes,
          title: formData.title || null,
          pgy_level: selectedPGY === 'all' ? null : selectedPGY,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add residents to the session
      if (filteredResidents.length > 0) {
        const sessionResidents = filteredResidents.map((r, index) => ({
          session_id: data.id,
          resident_id: r.id,
          discussion_order: index + 1,
          time_allocated: Math.floor(formData.duration_minutes / filteredResidents.length),
        }));

        await supabaseClient
          .from('ccc_session_residents')
          .insert(sessionResidents);
      }

      onCreated(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Understand] Error creating session:', message);
      alert(`Failed to create session: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-neutral-800">Create CCC Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Session Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Session Date
                </label>
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Session Type
                </label>
                <select
                  value={formData.session_type}
                  onChange={(e) => setFormData({ ...formData, session_type: e.target.value as 'Fall' | 'Spring' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="2025-2026"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  min={15}
                  max={240}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Session Title (optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Spring 2026 PGY-3 Review"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] transition-colors"
              />
            </div>

            {/* PGY Level Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                PGY Level
              </label>
              <div className="flex flex-wrap gap-2">
                {getActivePGYLevels(3).map((pgy) => (
                  <button
                    key={pgy}
                    type="button"
                    onClick={() => setSelectedPGY(pgy)}
                    style={selectedPGY === pgy ? { backgroundColor: '#0EA5E9', color: 'white' } : {}}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPGY === pgy
                        ? 'shadow-md'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {formatPGYLevel(pgy)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedPGY('all')}
                  style={selectedPGY === 'all' ? { backgroundColor: '#0EA5E9', color: 'white' } : {}}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPGY === 'all'
                      ? 'shadow-md'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All Levels
                </button>
              </div>
              {selectedPGY !== 'all' && (
                <p className="text-sm text-neutral-500 mt-2">
                  Class of {getTargetGraduationYear()} • {filteredResidents.length} residents
                </p>
              )}
              {selectedPGY === 'all' && (
                <p className="text-sm text-neutral-500 mt-2">
                  {filteredResidents.length} total residents
                </p>
              )}
            </div>

            {/* Residents Preview */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Residents ({filteredResidents.length})
              </label>
              <div className="border border-neutral-200 rounded-lg max-h-40 overflow-y-auto">
                {filteredResidents.length === 0 ? (
                  <p className="p-4 text-neutral-500 text-center">No residents found</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {filteredResidents.map((resident) => (
                      <div key={resident.id} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-neutral-700">{resident.full_name}</span>
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                          {resident.anon_code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Pinned to bottom */}
          <div className="p-6 border-t border-neutral-200 bg-white flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || filteredResidents.length === 0}
              className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



