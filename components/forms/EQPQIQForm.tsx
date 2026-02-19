'use client';

import React, { useState, useEffect } from 'react';
import EQPQIQFormSection from './EQPQIQFormSection';

interface EQPQIQFormProps {
  residentId: string;
  residentName: string;
  raterType: 'core_faculty' | 'teaching_faculty' | 'self';
  periodLabel: string;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
  isEditMode?: boolean;
}

export interface FormData {
  // EQ Attributes
  eq_empathy: number;
  eq_adaptability: number;
  eq_stress: number;
  eq_curiosity: number;
  eq_communication: number;
  
  // IQ Attributes
  iq_knowledge: number;
  iq_analytical: number;
  iq_learning: number;
  iq_flexibility: number;
  iq_performance: number;
  
  // PQ Attributes
  pq_work_ethic: number;
  pq_integrity: number;
  pq_teachability: number;
  pq_documentation: number;
  pq_leadership: number;
  
  // Optional fields
  comments?: string;
  concerns_goals?: string;
}

const EQ_ATTRIBUTES = [
  {
    key: 'eq_empathy',
    label: 'Empathy and Positive Interactions',
    description: 'Patient/family rapport, compassionate care',
  },
  {
    key: 'eq_adaptability',
    label: 'Adaptability and Self-Awareness',
    description: 'Flexibility, insight into strengths/weaknesses',
  },
  {
    key: 'eq_stress',
    label: 'Stress Management and Resilience',
    description: 'Performance under pressure, emotional regulation',
  },
  {
    key: 'eq_curiosity',
    label: 'Curiosity & Growth Mindset',
    description: 'Learning drive, seeking improvement',
  },
  {
    key: 'eq_communication',
    label: 'Effectiveness in Communication',
    description: 'Team communication, handoffs, presentations',
  },
];

const IQ_ATTRIBUTES = [
  {
    key: 'iq_knowledge',
    label: 'Strong Knowledge Base',
    description: 'Medical knowledge breadth and depth',
  },
  {
    key: 'iq_analytical',
    label: 'Analytical Thinking and Problem-Solving',
    description: 'Clinical reasoning, differential diagnosis',
  },
  {
    key: 'iq_learning',
    label: 'Commitment to Learning',
    description: 'Acquiring new information, staying current',
  },
  {
    key: 'iq_flexibility',
    label: 'Adaptability in Clinical Reasoning',
    description: 'Adjusting approach based on new information',
  },
  {
    key: 'iq_performance',
    label: 'Clinical Abilities for Level of Training',
    description: 'Overall clinical performance relative to peers',
  },
];

const PQ_ATTRIBUTES = [
  {
    key: 'pq_work_ethic',
    label: 'Work Ethic, Reliability & Professional Presence',
    description: 'Dedication, punctuality, follow-through',
  },
  {
    key: 'pq_integrity',
    label: 'Integrity and Accountability',
    description: 'Ethics, honesty, ownership of mistakes',
  },
  {
    key: 'pq_teachability',
    label: 'Teachability and Receptiveness',
    description: 'Accepting feedback, implementing suggestions',
  },
  {
    key: 'pq_documentation',
    label: 'Clear and Timely Documentation',
    description: 'Charting quality, completeness, timeliness',
  },
  {
    key: 'pq_leadership',
    label: 'Ability to Lead & Build Relationships',
    description: 'Team dynamics, leadership potential',
  },
];

export default function EQPQIQForm({
  residentId: _residentId,
  residentName,
  raterType,
  periodLabel,
  onSubmit,
  initialData,
  isEditMode = false,
}: EQPQIQFormProps) {
  const [values, setValues] = useState<Record<string, number>>({
    eq_empathy: 50,
    eq_adaptability: 50,
    eq_stress: 50,
    eq_curiosity: 50,
    eq_communication: 50,
    iq_knowledge: 50,
    iq_analytical: 50,
    iq_learning: 50,
    iq_flexibility: 50,
    iq_performance: 50,
    pq_work_ethic: 50,
    pq_integrity: 50,
    pq_teachability: 50,
    pq_documentation: 50,
    pq_leadership: 50,
  });

  const [textFields, setTextFields] = useState({
    comments: '',
    concerns_goals: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      const newValues: Record<string, number> = {};
      Object.keys(values).forEach((key) => {
        newValues[key] = (initialData as Record<string, number>)[key] || 50;
      });
      setValues(newValues);
      
      setTextFields({
        comments: initialData.comments || '',
        concerns_goals: initialData.concerns_goals || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleValueChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const calculateAverage = (keys: string[]): number => {
    const sum = keys.reduce((acc, key) => acc + (values[key] || 0), 0);
    return sum / keys.length;
  };

  const eqAvg = calculateAverage(EQ_ATTRIBUTES.map((a) => a.key));
  const iqAvg = calculateAverage(IQ_ATTRIBUTES.map((a) => a.key));
  const pqAvg = calculateAverage(PQ_ATTRIBUTES.map((a) => a.key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData: FormData = {
        eq_empathy: values.eq_empathy,
        eq_adaptability: values.eq_adaptability,
        eq_stress: values.eq_stress,
        eq_curiosity: values.eq_curiosity,
        eq_communication: values.eq_communication,
        iq_knowledge: values.iq_knowledge,
        iq_analytical: values.iq_analytical,
        iq_learning: values.iq_learning,
        iq_flexibility: values.iq_flexibility,
        iq_performance: values.iq_performance,
        pq_work_ethic: values.pq_work_ethic,
        pq_integrity: values.pq_integrity,
        pq_teachability: values.pq_teachability,
        pq_documentation: values.pq_documentation,
        pq_leadership: values.pq_leadership,
      };

      if ((raterType === 'core_faculty' || raterType === 'teaching_faculty') && textFields.comments) {
        formData.comments = textFields.comments;
      }

      if (raterType === 'self' && textFields.concerns_goals) {
        formData.concerns_goals = textFields.concerns_goals;
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#05BFDB] to-[#7EC8E3] text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          {isEditMode ? 'Edit' : 'Submit'} {raterType !== 'self' ? 'Evaluation' : 'Self-Assessment'}
        </h2>
        <p className="text-white/90">
          {raterType !== 'self' ? `Evaluating: ${residentName}` : `Self-Assessment for ${residentName}`}
        </p>
        <p className="text-sm text-white/80 mt-1">Period: {periodLabel}</p>
      </div>

      {/* EQ Section */}
      <EQPQIQFormSection
        title="EQ: Emotional Intelligence"
        subtitle="Mastering Interpersonal and Intrapersonal Skills"
        color="text-blue-600"
        attributes={EQ_ATTRIBUTES}
        values={values}
        onChange={handleValueChange}
        average={eqAvg}
      />

      {/* IQ Section */}
      <EQPQIQFormSection
        title="IQ: Intellectual Intelligence"
        subtitle="Clinical Acumen and Critical Thinking"
        color="text-purple-600"
        attributes={IQ_ATTRIBUTES}
        values={values}
        onChange={handleValueChange}
        average={iqAvg}
      />

      {/* PQ Section */}
      <EQPQIQFormSection
        title="PQ: Professional Intelligence"
        subtitle="Professional Decorum and Leadership"
        color="text-green-600"
        attributes={PQ_ATTRIBUTES}
        values={values}
        onChange={handleValueChange}
        average={pqAvg}
      />

      {/* Text Fields */}
      {(raterType === 'core_faculty' || raterType === 'teaching_faculty') && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Comments (Optional)
          </label>
          <textarea
            value={textFields.comments}
            onChange={(e) => setTextFields((prev) => ({ ...prev, comments: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#05BFDB] focus:border-transparent"
            placeholder="Additional comments or observations..."
          />
        </div>
      )}

      {raterType === 'self' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Concerns & Goals (Optional)
          </label>
          <textarea
            value={textFields.concerns_goals}
            onChange={(e) => setTextFields((prev) => ({ ...prev, concerns_goals: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#05BFDB] focus:border-transparent"
            placeholder="What are your current concerns or goals?"
          />
        </div>
      )}

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-neutral-600">EQ Average</div>
            <div className="text-3xl font-bold text-blue-600">{eqAvg.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-neutral-600">IQ Average</div>
            <div className="text-3xl font-bold text-purple-600">{iqAvg.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-neutral-600">PQ Average</div>
            <div className="text-3xl font-bold text-green-600">{pqAvg.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#05BFDB] text-white rounded-lg hover:bg-[#7EC8E3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : isEditMode ? 'Update' : 'Submit'} {raterType !== 'self' ? 'Evaluation' : 'Assessment'}
        </button>
      </div>
    </form>
  );
}


