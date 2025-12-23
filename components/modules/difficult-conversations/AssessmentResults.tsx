// Assessment Results Component
// Displays empathy, clarity, and accountability scores with visual feedback

'use client';

import { CheckCircle2, AlertCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface AssessmentResultsProps {
  scores: {
    empathy: number;
    clarity: number;
    accountability: number;
    overall: number;
  };
  passingScore?: number;
  excellenceScore?: number;
  showDetails?: boolean;
  compact?: boolean;
}

export default function AssessmentResults({
  scores,
  passingScore = 0.7,
  excellenceScore = 0.85,
  showDetails = true,
  compact = false,
}: AssessmentResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= excellenceScore) return 'from-[#86C5A8] to-[#6BA890]'; // Green
    if (score >= passingScore) return 'from-[#7EC8E3] to-[#5BA8C4]'; // Blue
    if (score >= passingScore * 0.7) return 'from-[#FFD89B] to-[#FFB5A7]'; // Yellow/Orange
    return 'from-[#F4A5A5] to-[#E89595]'; // Red
  };

  const getScoreLabel = (score: number): { label: string; icon: React.ReactNode } => {
    if (score >= excellenceScore) {
      return {
        label: 'Exemplary',
        icon: <CheckCircle2 size={18} className="text-[#86C5A8]" />,
      };
    }
    if (score >= passingScore) {
      return {
        label: 'Proficient',
        icon: <CheckCircle2 size={18} className="text-[#7EC8E3]" />,
      };
    }
    if (score >= passingScore * 0.7) {
      return {
        label: 'Developing',
        icon: <AlertCircle size={18} className="text-[#FFD89B]" />,
      };
    }
    return {
      label: 'Needs Improvement',
      icon: <XCircle size={18} className="text-[#F4A5A5]" />,
    };
  };

  const overallAssessment = getScoreLabel(scores.overall);

  if (compact) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm text-neutral-800">Overall Score</span>
          <div className="flex items-center gap-2">
            {overallAssessment.icon}
            <span className="text-sm font-medium text-neutral-700">{overallAssessment.label}</span>
          </div>
        </div>
        <div className="w-full bg-white/40 rounded-full h-2">
          <div
            className={`bg-gradient-to-r ${getScoreColor(scores.overall)} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${scores.overall * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-neutral-600">
          <span>{Math.round(scores.overall * 100)}%</span>
          <span>{scores.overall >= passingScore ? 'Passing' : 'Below Threshold'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-neutral-800">Assessment Results</h3>
          <div className="flex items-center gap-2">
            {overallAssessment.icon}
            <span className="text-sm font-medium text-neutral-700">{overallAssessment.label}</span>
          </div>
        </div>
        <div className="w-full bg-white/40 rounded-full h-3 mb-2">
          <div
            className={`bg-gradient-to-r ${getScoreColor(scores.overall)} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${scores.overall * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">Overall Score</span>
          <span className="font-semibold text-neutral-800">{Math.round(scores.overall * 100)}%</span>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4">
          {/* Empathy Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-neutral-700">Empathy</span>
              <span className="text-xs text-neutral-600">{Math.round(scores.empathy * 100)}%</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getScoreColor(scores.empathy)} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${scores.empathy * 100}%` }}
              />
            </div>
          </div>

          {/* Clarity Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-neutral-700">Clarity</span>
              <span className="text-xs text-neutral-600">{Math.round(scores.clarity * 100)}%</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getScoreColor(scores.clarity)} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${scores.clarity * 100}%` }}
              />
            </div>
          </div>

          {/* Accountability Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-neutral-700">Accountability</span>
              <span className="text-xs text-neutral-600">{Math.round(scores.accountability * 100)}%</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getScoreColor(scores.accountability)} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${scores.accountability * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="mt-4 pt-4 border-t border-white/30">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-neutral-700">Passing</div>
            <div className={`text-xs ${scores.overall >= passingScore ? 'text-[#86C5A8]' : 'text-neutral-400'}`}>
              {Math.round(passingScore * 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-neutral-700">Excellence</div>
            <div className={`text-xs ${scores.overall >= excellenceScore ? 'text-[#86C5A8]' : 'text-neutral-400'}`}>
              {Math.round(excellenceScore * 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-neutral-700">Status</div>
            <div className={`text-xs font-semibold ${
              scores.overall >= excellenceScore
                ? 'text-[#86C5A8]'
                : scores.overall >= passingScore
                ? 'text-[#7EC8E3]'
                : 'text-[#F4A5A5]'
            }`}>
              {scores.overall >= excellenceScore
                ? 'Excellent'
                : scores.overall >= passingScore
                ? 'Passing'
                : 'Below'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


