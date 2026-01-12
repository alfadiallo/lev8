'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Stethoscope, Activity, Syringe, MessageSquare } from 'lucide-react';

interface CurriculumTopic {
  id: string;
  curriculum_id: string;
  month: number;
  week: number;
  month_name: string;
  core_content: string;
  tintinalli_chapters: string[];
  rosh_topics: string[];
  ultrasound_competency: string;
  procedures_sim: string;
  conference_type: string;
  learning_objectives: string[] | null;
  created_at: string;
}

interface Curriculum {
  id: string;
  specialty: string;
  name: string;
  version: string;
  total_months: number;
  description: string;
  source_reference: string;
  is_active: boolean;
}

interface CurriculumData {
  curriculum: Curriculum;
  topics: CurriculumTopic[];
  topicsByMonth: Record<number, CurriculumTopic[]>;
}

const CONFERENCE_COLORS: Record<string, string> = {
  'Journal Club': 'bg-purple-100 text-purple-700 border-purple-200',
  'M&M': 'bg-red-100 text-red-700 border-red-200',
  'Case Conference': 'bg-blue-100 text-blue-700 border-blue-200',
  'QI': 'bg-green-100 text-green-700 border-green-200',
  'Simulation': 'bg-orange-100 text-orange-700 border-orange-200',
  'ECG Workshop': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Trauma M&M': 'bg-red-100 text-red-700 border-red-200',
  'Radiology Rounds': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Workshop': 'bg-amber-100 text-amber-700 border-amber-200',
  'Board-Style Questions': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Oral Board Practice': 'bg-teal-100 text-teal-700 border-teal-200',
  'Panel Discussion': 'bg-violet-100 text-violet-700 border-violet-200',
  'Ethics Discussion': 'bg-slate-100 text-slate-700 border-slate-200',
  'Legal Case Review': 'bg-gray-100 text-gray-700 border-gray-200',
  'Poison Control Integration': 'bg-lime-100 text-lime-700 border-lime-200',
  'Wellness Presentation': 'bg-pink-100 text-pink-700 border-pink-200',
  'Cognitive Autopsy Workshop': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'Feedback and Remediation': 'bg-rose-100 text-rose-700 border-rose-200',
  'Graduation Conference': 'bg-sky-100 text-sky-700 border-sky-200',
  'Senior Resident Teaching': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

export default function CurriculumPage() {
  const [data, setData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([1]));
  const [selectedWeek, setSelectedWeek] = useState<CurriculumTopic | null>(null);

  useEffect(() => {
    async function fetchCurriculum() {
      try {
        const response = await fetch('/api/studio/curriculum');
        if (!response.ok) {
          throw new Error('Failed to fetch curriculum');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchCurriculum();
  }, []);

  const toggleMonth = (month: number) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  const getPhaseLabel = (month: number) => {
    if (month <= 12) return 'Primary Cycle';
    return 'Mastery Cycle';
  };

  const getPhaseColor = (month: number) => {
    if (month <= 12) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--theme-text-muted)' }}>Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading curriculum</p>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p style={{ color: 'var(--theme-text-muted)' }}>No curriculum data available</p>
      </div>
    );
  }

  const { curriculum, topicsByMonth } = data;
  const months = Object.keys(topicsByMonth).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
            {curriculum.name}
          </h1>
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}>
            {curriculum.version}
          </span>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          {curriculum.description}
        </p>
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Source: {curriculum.source_reference}
        </p>
      </div>

      {/* Phase Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Primary Cycle (Months 1-12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Mastery Cycle (Months 13-18)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month List */}
        <div className="lg:col-span-1 space-y-2">
          {months.map((month) => {
            const weeks = topicsByMonth[month];
            const monthName = weeks[0]?.month_name || `Month ${month}`;
            const isExpanded = expandedMonths.has(month);
            const phaseColor = getPhaseColor(month);

            return (
              <div 
                key={month}
                className="rounded-xl overflow-hidden"
                style={{ 
                  background: 'var(--theme-surface-solid)',
                  border: '1px solid var(--theme-border-solid)'
                }}
              >
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${phaseColor}`} />
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                        Month {month}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {monthName}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} style={{ color: 'var(--theme-text-muted)' }} />
                  ) : (
                    <ChevronRight size={16} style={{ color: 'var(--theme-text-muted)' }} />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t" style={{ borderColor: 'var(--theme-border-solid)' }}>
                    {weeks.map((week) => (
                      <button
                        key={week.id}
                        onClick={() => setSelectedWeek(week)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-black/5 transition-colors ${
                          selectedWeek?.id === week.id ? 'bg-black/5' : ''
                        }`}
                        style={{
                          borderBottom: '1px solid var(--theme-border-solid)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                            Week {week.week}
                          </span>
                          {week.conference_type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${CONFERENCE_COLORS[week.conference_type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {week.conference_type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                          {week.core_content}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedWeek ? (
            <div 
              className="rounded-xl p-6 sticky top-6"
              style={{ 
                background: 'var(--theme-surface-solid)',
                border: '1px solid var(--theme-border-solid)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}>
                      Month {selectedWeek.month} • Week {selectedWeek.week}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedWeek.month <= 12 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {getPhaseLabel(selectedWeek.month)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                    {selectedWeek.month_name}
                  </h2>
                </div>
                {selectedWeek.conference_type && (
                  <span className={`text-sm px-3 py-1 rounded-full border ${CONFERENCE_COLORS[selectedWeek.conference_type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {selectedWeek.conference_type}
                  </span>
                )}
              </div>

              {/* Core Content */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                  <BookOpen size={16} style={{ color: 'var(--theme-primary)' }} />
                  Core Content
                </h3>
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  {selectedWeek.core_content}
                </p>
              </div>

              {/* Tintinalli Chapters */}
              {selectedWeek.tintinalli_chapters && selectedWeek.tintinalli_chapters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                    <BookOpen size={16} style={{ color: 'var(--theme-primary)' }} />
                    Tintinalli&apos;s Chapters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWeek.tintinalli_chapters.map((chapter, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ 
                          background: 'var(--theme-surface-hover)',
                          color: 'var(--theme-text)'
                        }}
                      >
                        {chapter}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rosh Topics */}
              {selectedWeek.rosh_topics && selectedWeek.rosh_topics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                    <MessageSquare size={16} style={{ color: 'var(--theme-primary)' }} />
                    Rosh Review Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWeek.rosh_topics.map((topic, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ultrasound Competency */}
              {selectedWeek.ultrasound_competency && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                    <Activity size={16} style={{ color: 'var(--theme-primary)' }} />
                    Ultrasound Competency
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {selectedWeek.ultrasound_competency}
                  </p>
                </div>
              )}

              {/* Procedures & Simulation */}
              {selectedWeek.procedures_sim && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                    <Syringe size={16} style={{ color: 'var(--theme-primary)' }} />
                    Procedures & Simulation
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {selectedWeek.procedures_sim}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]"
              style={{ 
                background: 'var(--theme-surface-solid)',
                border: '1px solid var(--theme-border-solid)'
              }}
            >
              <Stethoscope size={48} style={{ color: 'var(--theme-text-muted)', opacity: 0.3 }} className="mb-4" />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Select a week to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
