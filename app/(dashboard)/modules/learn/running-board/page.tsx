// Running the Board - Setup Page
// Select learner, choose preset or custom cases, then start simulation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import { 
  Clock, 
  PlayCircle, 
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  User,
  Briefcase,
} from 'lucide-react';
import {
  ClinicalCase,
  PresetShift,
  Learner,
  Educator,
  ACUITY_COLORS,
  getCategoryColor,
} from '@/lib/types/running-board';
import Leaderboard from '@/components/modules/running-board/Leaderboard';

type SetupMode = 'preset' | 'custom';

export default function RunningBoardPage() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [learners, setLearners] = useState<Learner[]>([]);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [presets, setPresets] = useState<PresetShift[]>([]);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  
  // Selection
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(null);
  const [customEducatorName, setCustomEducatorName] = useState('');
  const [useCustomEducator, setUseCustomEducator] = useState(false);
  const [setupMode, setSetupMode] = useState<SetupMode>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PresetShift | null>(null);
  const [selectedCases, setSelectedCases] = useState<ClinicalCase[]>([]);
  
  // Filters (for custom case selection)
  const [caseSearch, setCaseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // API routes now read auth from cookies automatically
      // Load learners, educators, presets, and cases in parallel
      const [learnersRes, educatorsRes, presetsRes, casesRes] = await Promise.all([
        fetch('/api/running-board/learners'),
        fetch('/api/running-board/educators'),
        fetch('/api/running-board/presets'),
        fetch('/api/running-board/cases'),
      ]);

      // Check for auth errors
      if (learnersRes.status === 401 || educatorsRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (learnersRes.ok) {
        const data = await learnersRes.json();
        setLearners(data.learners || []);
      }
      if (educatorsRes.ok) {
        const data = await educatorsRes.json();
        setEducators(data.educators || []);
      }
      if (presetsRes.ok) {
        const data = await presetsRes.json();
        setPresets(data.presets || []);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error('[RunningBoard] Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!selectedLearner) {
      setError('Please select a learner');
      return;
    }

    // Validate educator selection
    const hasEducator = useCustomEducator ? customEducatorName.trim() : selectedEducator;
    if (!hasEducator) {
      setError('Please select an educator or enter a custom name');
      return;
    }

    const caseIds = setupMode === 'preset' && selectedPreset
      ? selectedPreset.case_ids
      : selectedCases.map(c => c.id);

    if (caseIds.length === 0) {
      setError('Please select cases for the simulation');
      return;
    }

    try {
      setStarting(true);
      setError(null);

      // Prepare educator info
      const educatorInfo = useCustomEducator 
        ? {
            educator_name: customEducatorName.trim(),
            educator_type: 'custom',
          }
        : {
            educator_id: selectedEducator?.id,
            educator_name: selectedEducator?.full_name,
            educator_type: selectedEducator?.type,
          };

      // API routes now read auth from cookies automatically
      const response = await fetch('/api/running-board/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learner_id: selectedLearner.resident_id,
          learner_pgy_level: selectedLearner.pgy_level,
          preset_id: setupMode === 'preset' ? selectedPreset?.id : undefined,
          case_ids: setupMode === 'custom' ? caseIds : undefined,
          ...educatorInfo,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const { session: newSession } = await response.json();
      router.push(`/modules/learn/running-board/simulation/${newSession.id}`);
    } catch (err) {
      console.error('[RunningBoard] Error starting simulation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    } finally {
      setStarting(false);
    }
  };

  const toggleCaseSelection = (caseItem: ClinicalCase) => {
    if (selectedCases.find(c => c.id === caseItem.id)) {
      setSelectedCases(selectedCases.filter(c => c.id !== caseItem.id));
    } else if (selectedCases.length < 4) {
      setSelectedCases([...selectedCases, caseItem]);
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(caseSearch.toLowerCase()));
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(cases.map(c => c.category))];

  // Check if educator is selected
  const hasEducator = useCustomEducator ? customEducatorName.trim().length > 0 : selectedEducator !== null;

  // Check if ready to start
  const canStart = selectedLearner && hasEducator && (
    (setupMode === 'preset' && selectedPreset) ||
    (setupMode === 'custom' && selectedCases.length > 0)
  );

  // Handle selecting educator from dropdown
  const handleSelectEducator = (educator: Educator) => {
    setSelectedEducator(educator);
    setUseCustomEducator(false);
    setCustomEducatorName('');
  };

  if (loading) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
        <ModuleLayout title="Running the Board" description="Loading...">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  return (
    <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
      <ModuleLayout
        title="Running the Board"
        description="Multi-patient emergency department simulation"
        backHref="/modules/learn"
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Leaderboard */}
          <Leaderboard />

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Steps 1 & 2: Select Learner and Educator - Compact Dropdowns */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <span className="text-sky-600 font-bold">1</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800">Select Participants</h2>
                  <p className="text-sm text-neutral-500">Choose the learner and educator for this simulation</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Learner Dropdown */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <User size={16} className="text-neutral-500" />
                  Learner (Resident)
                </label>
                <select
                  value={selectedLearner?.id || ''}
                  onChange={(e) => {
                    const learner = learners.find(l => l.id === e.target.value);
                    setSelectedLearner(learner || null);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none bg-white ${
                    selectedLearner ? 'border-sky-500 bg-sky-50' : 'border-neutral-200'
                  }`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="">Select a resident...</option>
                  {learners.filter(l => l.is_recent).length > 0 && (
                    <optgroup label="Recent">
                      {learners.filter(l => l.is_recent).map((learner) => (
                        <option key={learner.id} value={learner.id}>
                          {learner.full_name} (PGY-{learner.pgy_level})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Residents">
                    {learners.filter(l => !l.is_recent).map((learner) => (
                      <option key={learner.id} value={learner.id}>
                        {learner.full_name} (PGY-{learner.pgy_level})
                      </option>
                    ))}
                  </optgroup>
                </select>
                {selectedLearner && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-sky-600">
                    <CheckCircle2 size={14} />
                    <span>{selectedLearner.full_name} • PGY-{selectedLearner.pgy_level}</span>
                  </div>
                )}
              </div>

              {/* Educator Dropdown */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <Briefcase size={16} className="text-neutral-500" />
                  Educator (Facilitator)
                </label>
                <select
                  value={useCustomEducator ? 'custom' : (selectedEducator?.id || '')}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomEducator(true);
                      setSelectedEducator(null);
                    } else {
                      const educator = educators.find(ed => ed.id === e.target.value);
                      if (educator) {
                        handleSelectEducator(educator);
                      } else {
                        setSelectedEducator(null);
                        setUseCustomEducator(false);
                      }
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none bg-white ${
                    (selectedEducator || useCustomEducator) ? 'border-sky-500 bg-sky-50' : 'border-neutral-200'
                  }`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="">Select an educator...</option>
                  <option value="custom">✏️ Enter custom name...</option>
                  {educators.filter(e => e.type === 'faculty').length > 0 && (
                    <optgroup label="Faculty">
                      {educators.filter(e => e.type === 'faculty').map((educator) => (
                        <option key={educator.id} value={educator.id}>
                          {educator.full_name}{educator.credentials ? `, ${educator.credentials}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {educators.filter(e => e.type === 'resident').length > 0 && (
                    <optgroup label="Residents">
                      {educators.filter(e => e.type === 'resident').map((educator) => (
                        <option key={educator.id} value={educator.id}>
                          {educator.full_name} (PGY-{educator.pgy_level})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Custom Name Input - Shows when custom is selected */}
                {useCustomEducator && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Enter educator name..."
                      value={customEducatorName}
                      onChange={(e) => setCustomEducatorName(e.target.value)}
                      autoFocus
                      className={`w-full px-4 py-3 border rounded-xl text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 ${
                        customEducatorName.trim() ? 'border-sky-500 bg-sky-50' : 'border-neutral-200'
                      }`}
                    />
                  </div>
                )}

                {/* Selection confirmation */}
                {selectedEducator && !useCustomEducator && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-sky-600">
                    <CheckCircle2 size={14} />
                    <span>
                      {selectedEducator.full_name}
                      {selectedEducator.type === 'faculty' && selectedEducator.credentials && `, ${selectedEducator.credentials}`}
                      {selectedEducator.type === 'resident' && ` (PGY-${selectedEducator.pgy_level})`}
                    </span>
                  </div>
                )}
                {useCustomEducator && customEducatorName.trim() && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-sky-600">
                    <CheckCircle2 size={14} />
                    <span>{customEducatorName.trim()} (Custom)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Select Cases */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <span className="text-sky-600 font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-800">Select Cases</h2>
                  <p className="text-sm text-neutral-500">Choose a preset shift or build your own</p>
                </div>
                
                {/* Mode Toggle */}
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setSetupMode('preset')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      setupMode === 'preset'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    Preset Shifts
                  </button>
                  <button
                    onClick={() => setSetupMode('custom')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      setupMode === 'custom'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    Custom Build
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {setupMode === 'preset' ? (
                /* Preset Shifts - iPad optimized */
                <div className="grid md:grid-cols-2 gap-4 touch-manipulation">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-5 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
                        selectedPreset?.id === preset.id
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-neutral-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-neutral-800">{preset.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          preset.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                          preset.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {preset.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">{preset.description}</p>
                      <div className="flex gap-2">
                        <Layers size={14} className="text-neutral-400 mt-0.5" />
                        <span className="text-xs text-neutral-500">{preset.case_ids?.length || 4} cases</span>
                      </div>
                      {selectedPreset?.id === preset.id && (
                        <div className="mt-3 flex items-center gap-1 text-sky-600">
                          <CheckCircle2 size={16} />
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Case Selection */
                <div>
                  {/* Filters */}
                  <div className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search cases..."
                        value={caseSearch}
                        onChange={(e) => setCaseSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Cases */}
                  {selectedCases.length > 0 && (
                    <div className="mb-4 p-3 bg-sky-50 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-sky-700">
                          Selected Cases ({selectedCases.length}/4)
                        </span>
                        <button
                          onClick={() => setSelectedCases([])}
                          className="text-xs text-sky-600 hover:text-sky-800"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCases.map((c, idx) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm border border-sky-200"
                          >
                            <span className="text-sky-600 font-medium">{idx + 1}.</span>
                            {c.title}
                            <button
                              onClick={() => toggleCaseSelection(c)}
                              className="ml-1 text-neutral-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Case Grid - iPad optimized */}
                  <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto touch-manipulation overscroll-contain">
                    {filteredCases.map((caseItem) => {
                      const isSelected = selectedCases.some(c => c.id === caseItem.id);
                      const acuity = ACUITY_COLORS[caseItem.acuity_level];
                      
                      return (
                        <button
                          key={caseItem.id}
                          onClick={() => toggleCaseSelection(caseItem)}
                          disabled={!isSelected && selectedCases.length >= 4}
                          className={`p-4 rounded-xl border-2 text-left transition-all min-h-[88px] active:scale-[0.99] ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50'
                              : selectedCases.length >= 4
                              ? 'border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed'
                              : 'border-neutral-200 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-neutral-800">{caseItem.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${acuity.bg} ${acuity.text}`}>
                              ESI-{caseItem.acuity_level}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">
                            {caseItem.patient_profile.demographics} • {caseItem.patient_profile.chief_complaint}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(caseItem.category)}`}>
                              {caseItem.category}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={16} className="text-sky-500 ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Start Button - iPad optimized with larger touch target */}
          <div className="flex justify-end">
            <button
              onClick={handleStartSimulation}
              disabled={!canStart || starting}
              className={`group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-[0.97] touch-manipulation ${
                canStart && !starting
                  ? 'bg-[#0EA5E9] text-white hover:bg-[#0284C7] shadow-lg shadow-[#0EA5E9]/30 hover:shadow-[#0EA5E9]/40 hover:-translate-y-0.5'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed border-2 border-dashed border-neutral-300'
              }`}
            >
              {starting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={24} className={canStart ? 'group-hover:scale-110 transition-transform' : ''} />
                  <span>Start Simulation</span>
                  <ChevronRight size={20} className={canStart ? 'group-hover:translate-x-1 transition-transform' : ''} />
                </>
              )}
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="text-neutral-400 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-neutral-800 mb-1">About This Simulation</h3>
                <p className="text-sm text-neutral-600">
                  Run a 20-minute multi-patient ED simulation. As the facilitator (PGY-3), you&apos;ll read scripts 
                  aloud and track the learner&apos;s actions as they manage multiple patients simultaneously. 
                  Critical actions are highlighted for easy tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModuleLayout>
    </ModuleGuard>
  );
}
