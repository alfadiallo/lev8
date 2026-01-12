'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  User,
  Clock,
  Activity,
  Stethoscope,
  FileText,
  CheckSquare
} from 'lucide-react';

interface PatientProfile {
  demographics: string;
  chief_complaint: string;
  history: string;
  medications: string;
  allergies: string;
}

interface TimelinePhase {
  id: string;
  phase_number: number;
  trigger: string;
  duration_minutes: number;
  narrative: string;
  vitals: {
    hr?: number;
    bp?: string;
    rr?: number;
    spo2?: number;
    temp?: number;
  };
  checklist_items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  text: string;
  is_critical: boolean;
  category: 'assessment' | 'orders' | 'disposition' | 'communication';
}

interface RunningBoardCaseData {
  title: string;
  category: string;
  acuity_level: number;
  tags: string[];
  patient_profile: PatientProfile;
  timeline: TimelinePhase[];
  debrief_points: string[];
}

const CATEGORIES = ['Infectious', 'Cardiovascular', 'GI', 'Neuro', 'Trauma', 'OBGYN', 'Respiratory', 'Toxicology', 'Psychiatric'];
const ACUITY_LEVELS = [
  { value: 1, label: 'ESI 1 - Resuscitation', color: 'bg-red-500' },
  { value: 2, label: 'ESI 2 - Emergent', color: 'bg-orange-500' },
  { value: 3, label: 'ESI 3 - Urgent', color: 'bg-yellow-500' },
  { value: 4, label: 'ESI 4 - Less Urgent', color: 'bg-green-500' },
  { value: 5, label: 'ESI 5 - Non-Urgent', color: 'bg-blue-500' },
];

const CHECKLIST_CATEGORIES = [
  { value: 'assessment', label: 'Assessment', icon: Stethoscope },
  { value: 'orders', label: 'Orders', icon: FileText },
  { value: 'disposition', label: 'Disposition', icon: User },
  { value: 'communication', label: 'Communication', icon: Activity },
];

export default function NewRunningBoardCasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('basics');
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase-1']);
  
  const [caseData, setCaseData] = useState<RunningBoardCaseData>({
    title: '',
    category: 'Cardiovascular',
    acuity_level: 2,
    tags: [],
    patient_profile: {
      demographics: '',
      chief_complaint: '',
      history: '',
      medications: '',
      allergies: '',
    },
    timeline: [
      {
        id: 'phase-1',
        phase_number: 1,
        trigger: 'Initial presentation',
        duration_minutes: 5,
        narrative: '',
        vitals: {},
        checklist_items: [],
      },
    ],
    debrief_points: [],
  });

  const [tagInput, setTagInput] = useState('');

  const handleSave = async (status: 'draft' | 'review') => {
    if (!caseData.title.trim()) {
      alert('Please enter a case title');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/studio/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'running_board_case',
          title: caseData.title,
          specialty: caseData.category,
          status,
          content_data: caseData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const { id } = await response.json();
      router.push(`/studio/content/running-board/${id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save case. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPhase = () => {
    const newPhase: TimelinePhase = {
      id: `phase-${caseData.timeline.length + 1}`,
      phase_number: caseData.timeline.length + 1,
      trigger: '',
      duration_minutes: 5,
      narrative: '',
      vitals: {},
      checklist_items: [],
    };
    setCaseData(prev => ({
      ...prev,
      timeline: [...prev.timeline, newPhase],
    }));
    setExpandedPhases(prev => [...prev, newPhase.id]);
  };

  const removePhase = (phaseId: string) => {
    if (caseData.timeline.length <= 1) return;
    setCaseData(prev => ({
      ...prev,
      timeline: prev.timeline.filter(p => p.id !== phaseId).map((p, i) => ({
        ...p,
        phase_number: i + 1,
      })),
    }));
  };

  const updatePhase = (phaseId: string, updates: Partial<TimelinePhase>) => {
    setCaseData(prev => ({
      ...prev,
      timeline: prev.timeline.map(p => p.id === phaseId ? { ...p, ...updates } : p),
    }));
  };

  const addChecklistItem = (phaseId: string) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: '',
      is_critical: false,
      category: 'assessment',
    };
    updatePhase(phaseId, {
      checklist_items: [
        ...caseData.timeline.find(p => p.id === phaseId)!.checklist_items,
        newItem,
      ],
    });
  };

  const updateChecklistItem = (phaseId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    const phase = caseData.timeline.find(p => p.id === phaseId);
    if (!phase) return;
    updatePhase(phaseId, {
      checklist_items: phase.checklist_items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeChecklistItem = (phaseId: string, itemId: string) => {
    const phase = caseData.timeline.find(p => p.id === phaseId);
    if (!phase) return;
    updatePhase(phaseId, {
      checklist_items: phase.checklist_items.filter(item => item.id !== itemId),
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !caseData.tags.includes(tagInput.trim())) {
      setCaseData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCaseData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">New Running Board Case</h1>
            <p className="text-gray-400 text-sm">Create a multi-patient ED simulation scenario</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('review')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Eye size={18} />
            Submit for Review
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[
          { id: 'basics', label: 'Basics' },
          { id: 'patient', label: 'Patient Profile' },
          { id: 'timeline', label: 'Timeline & Checklist' },
          { id: 'debrief', label: 'Debrief Points' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Basics Section */}
        {activeSection === 'basics' && (
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Case Title *</label>
                <input
                  type="text"
                  value={caseData.title}
                  onChange={(e) => setCaseData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Chest Pain with STEMI"
                  className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Category & Acuity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={caseData.category}
                    onChange={(e) => setCaseData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Acuity Level</label>
                  <select
                    value={caseData.acuity_level}
                    onChange={(e) => setCaseData(prev => ({ ...prev, acuity_level: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {ACUITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {caseData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Profile Section */}
        {activeSection === 'patient' && (
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Patient Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Demographics</label>
                <input
                  type="text"
                  value={caseData.patient_profile.demographics}
                  onChange={(e) => setCaseData(prev => ({
                    ...prev,
                    patient_profile: { ...prev.patient_profile, demographics: e.target.value }
                  }))}
                  placeholder="e.g., 65-year-old male"
                  className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  value={caseData.patient_profile.chief_complaint}
                  onChange={(e) => setCaseData(prev => ({
                    ...prev,
                    patient_profile: { ...prev.patient_profile, chief_complaint: e.target.value }
                  }))}
                  placeholder="e.g., Crushing chest pain for 2 hours"
                  className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">History</label>
                <textarea
                  value={caseData.patient_profile.history}
                  onChange={(e) => setCaseData(prev => ({
                    ...prev,
                    patient_profile: { ...prev.patient_profile, history: e.target.value }
                  }))}
                  rows={3}
                  placeholder="Relevant medical history..."
                  className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Medications</label>
                  <input
                    type="text"
                    value={caseData.patient_profile.medications}
                    onChange={(e) => setCaseData(prev => ({
                      ...prev,
                      patient_profile: { ...prev.patient_profile, medications: e.target.value }
                    }))}
                    placeholder="Current medications..."
                    className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Allergies</label>
                  <input
                    type="text"
                    value={caseData.patient_profile.allergies}
                    onChange={(e) => setCaseData(prev => ({
                      ...prev,
                      patient_profile: { ...prev.patient_profile, allergies: e.target.value }
                    }))}
                    placeholder="Known allergies..."
                    className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {activeSection === 'timeline' && (
          <div className="space-y-4">
            {caseData.timeline.map((phase) => (
              <div
                key={phase.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Phase Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-gray-500" />
                    {expandedPhases.includes(phase.id) ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                    <span className="text-white font-medium">Phase {phase.phase_number}</span>
                    <span className="text-gray-400 text-sm">• {phase.trigger || 'No trigger set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {phase.duration_minutes} min
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckSquare size={12} />
                      {phase.checklist_items.length} items
                    </span>
                    {caseData.timeline.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhase(phase.id);
                        }}
                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Phase Content */}
                {expandedPhases.includes(phase.id) && (
                  <div className="p-4 pt-0 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Trigger & Duration */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Trigger</label>
                        <input
                          type="text"
                          value={phase.trigger}
                          onChange={(e) => updatePhase(phase.id, { trigger: e.target.value })}
                          placeholder="What starts this phase?"
                          className="w-full px-3 py-2 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                        <input
                          type="number"
                          value={phase.duration_minutes}
                          onChange={(e) => updatePhase(phase.id, { duration_minutes: parseInt(e.target.value) || 5 })}
                          min={1}
                          max={30}
                          className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    </div>

                    {/* Narrative */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Narrative Script</label>
                      <textarea
                        value={phase.narrative}
                        onChange={(e) => updatePhase(phase.id, { narrative: e.target.value })}
                        rows={3}
                        placeholder="What the facilitator reads to the learner..."
                        className="w-full px-3 py-2 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>

                    {/* Vitals */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Vitals</label>
                      <div className="grid grid-cols-5 gap-2">
                        {['HR', 'BP', 'RR', 'SpO2', 'Temp'].map((vital) => (
                          <div key={vital}>
                            <span className="text-xs text-gray-500">{vital}</span>
                            <input
                              type="text"
                              value={phase.vitals[vital.toLowerCase() as keyof typeof phase.vitals] || ''}
                              onChange={(e) => updatePhase(phase.id, {
                                vitals: { ...phase.vitals, [vital.toLowerCase()]: e.target.value }
                              })}
                              placeholder="-"
                              className="w-full px-2 py-1 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-center"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklist Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300">Checklist Items</label>
                        <button
                          onClick={() => addChecklistItem(phase.id)}
                          className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Item
                        </button>
                      </div>
                      <div className="space-y-2">
                        {phase.checklist_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                          >
                            <button
                              onClick={() => updateChecklistItem(phase.id, item.id, { is_critical: !item.is_critical })}
                              className={`p-1 rounded ${item.is_critical ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}
                              title={item.is_critical ? 'Critical item' : 'Mark as critical'}
                            >
                              <AlertCircle size={14} />
                            </button>
                            <select
                              value={item.category}
                              onChange={(e) => updateChecklistItem(phase.id, item.id, { category: e.target.value as ChecklistItem['category'] })}
                              className="px-2 py-1 rounded text-xs text-white focus:outline-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              {CHECKLIST_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateChecklistItem(phase.id, item.id, { text: e.target.value })}
                              placeholder="Checklist item text..."
                              className="flex-1 px-2 py-1 rounded text-white text-sm placeholder-gray-500 focus:outline-none"
                              style={{ background: 'transparent' }}
                            />
                            <button
                              onClick={() => removeChecklistItem(phase.id, item.id)}
                              className="p-1 rounded text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {phase.checklist_items.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            No checklist items yet. Add items the learner should complete.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Phase Button */}
            <button
              onClick={addPhase}
              className="w-full p-4 rounded-xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Phase
            </button>
          </div>
        )}

        {/* Debrief Section */}
        {activeSection === 'debrief' && (
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Debrief Discussion Points</h2>
            <p className="text-gray-400 text-sm mb-4">
              Add key points to discuss during the debrief session after the simulation.
            </p>
            
            <div className="space-y-2">
              {caseData.debrief_points.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{index + 1}.</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...caseData.debrief_points];
                      newPoints[index] = e.target.value;
                      setCaseData(prev => ({ ...prev, debrief_points: newPoints }));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={() => {
                      setCaseData(prev => ({
                        ...prev,
                        debrief_points: prev.debrief_points.filter((_, i) => i !== index)
                      }));
                    }}
                    className="p-2 rounded text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setCaseData(prev => ({ ...prev, debrief_points: [...prev.debrief_points, ''] }))}
                className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
              >
                <Plus size={16} />
                Add Discussion Point
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
