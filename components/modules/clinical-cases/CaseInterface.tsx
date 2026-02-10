// Case Interface Component - Displays and interacts with case content

'use client';

import { useState } from 'react';
import { ClinicalCase, CaseAttempt } from '@/lib/types/modules';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface CaseStep {
  id?: string;
  title?: string;
  content?: string;
}

interface CaseQuestion {
  id?: string;
  question?: string;
  options?: string[];
  answer?: string | number;
}

interface CaseInterfaceProps {
  case_: ClinicalCase;
  attempt: CaseAttempt | null;
  onSaveProgress: (progressData: Record<string, unknown>, completed: boolean, score?: number) => Promise<void>;
}

export default function CaseInterface({ case_, attempt, onSaveProgress }: CaseInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(attempt?.progress_data || {});
  const [completed, setCompleted] = useState(attempt?.completed || false);

  // Extract case content from case_data (Record<string, unknown>)
  const caseData = (case_.case_data || {}) as { steps?: CaseStep[]; questions?: (CaseQuestion & { text?: string; type?: string })[] };
  const steps = caseData.steps ?? [];
  const questions = caseData.questions ?? [];

  const handleAnswer = async (questionId: string, answer: unknown) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-save progress
    await onSaveProgress(newAnswers, false);
  };

  const handleComplete = async () => {
    // Calculate score (placeholder - implement based on your scoring logic)
    const score = calculateScore(answers, questions);
    setCompleted(true);
    await onSaveProgress(answers, true, score);
  };

  const calculateScore = (_userAnswers: Record<string, unknown>, _questions: CaseQuestion[]): number => {
    // TODO: Implement scoring logic based on questions and answers
    // For now, return a placeholder score
    return 0;
  };

  if (completed) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30 text-center">
        <CheckCircle2 size={64} className="mx-auto mb-4 text-[#86C5A8]" />
        <h2 className="text-2xl font-bold mb-2 text-neutral-800">Case Completed!</h2>
        <p className="text-neutral-600 mb-6">You&apos;ve successfully completed this clinical case.</p>
        {attempt?.score !== undefined && (
          <div className="mb-6">
            <p className="text-lg font-semibold text-neutral-800">Score: {attempt.score.toFixed(1)}%</p>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
        >
          Review Case
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Case Content */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800">Case Presentation</h2>
        {steps.length > 0 ? (
          <div className="space-y-4">
            {steps.map((step: CaseStep, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-xl ${
                  index === currentStep
                    ? 'bg-[#D4F1F4]/50 border-2 border-[#7EC8E3]'
                    : 'bg-white/50 border border-white/30'
                }`}
              >
                <h3 className="font-semibold mb-2 text-neutral-800">{step.title || `Step ${index + 1}`}</h3>
                <p className="text-neutral-700 whitespace-pre-wrap">{step.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-600">Case content will be displayed here.</p>
        )}
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-800">Questions</h2>
          <div className="space-y-6">
            {questions.map((question: CaseQuestion & { text?: string; type?: string }, index: number) => (
              <div key={question.id || index} className="border-b border-white/30 pb-6 last:border-0">
                <h3 className="font-semibold mb-3 text-neutral-800">{question.text}</h3>
                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option: string, optIndex: number) => (
                      <button
                        key={optIndex}
                        onClick={() => handleAnswer(question.id || index.toString(), option)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          answers[question.id || index.toString()] === option
                            ? 'bg-[#D4F1F4]/50 border-[#7EC8E3] text-[#7EC8E3]'
                            : 'bg-white/30 border-white/40 text-neutral-700 hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {answers[question.id || index.toString()] === option ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Circle size={20} />
                          )}
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {question.type === 'text' && (
                  <textarea
                    value={String(answers[question.id || index.toString()] || '')}
                    onChange={(e) => handleAnswer(question.id || index.toString(), e.target.value)}
                    className="w-full p-3 rounded-xl border border-white/40 bg-white/30 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
                    rows={4}
                    placeholder="Enter your answer..."
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 bg-gradient-to-r from-[#86C5A8] to-[#7EC8E3] text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Complete Case
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}


