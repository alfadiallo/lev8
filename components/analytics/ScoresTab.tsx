// Scores Tab Component
// Displays EQ+PQ+IQ scores with radar charts, gap analysis, and ITE correlation

'use client';

import { useState } from 'react';
import { PeriodScore, ITEScore } from '@/lib/types/analytics';
import RadarChart from './RadarChart';
import GapAnalysis from './GapAnalysis';
import PeriodSelector from './PeriodSelector';

interface ScoresTabProps {
  periodScores: PeriodScore[];
  iteScores?: ITEScore[];
  loading?: boolean;
}

export default function ScoresTab({ periodScores, iteScores = [], loading }: ScoresTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Filter data by period
  const filteredScores = selectedPeriod === 'all'
    ? periodScores
    : periodScores.filter(s => s.period_label === selectedPeriod);

  // Get unique periods for selector
  const periods = Array.from(new Set(periodScores.map(s => s.period_label))).sort().reverse();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 rounded-xl h-96" />
        <div className="animate-pulse bg-gray-100 rounded-xl h-64" />
      </div>
    );
  }

  if (periodScores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">No Scores Available</h3>
        <p className="text-neutral-600">
          Scores will be available once evaluation forms are submitted and processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <PeriodSelector
        periods={periods}
        selectedPeriod={selectedPeriod}
        onChange={setSelectedPeriod}
      />

      {/* Display scores for each period */}
      {filteredScores.map((score) => (
        <div key={score.id} className="space-y-6">
          {/* Period Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-800">{score.period_label}</h3>
            <div className="text-sm text-neutral-600">
              {score.faculty_n_raters && (
                <span>{score.faculty_n_raters} faculty evaluation{score.faculty_n_raters !== 1 ? 's' : ''}</span>
              )}
              {score.ai_n_comments && (
                <span className="ml-3">{score.ai_n_comments} historical comment{score.ai_n_comments !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Radar Chart - Faculty vs Self */}
          {score.faculty_eq_avg && score.self_eq_avg && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <RadarChart
                facultyData={{
                  // EQ attributes
                  eq_empathy: score.faculty_ratings_detail?.eq_empathy || score.faculty_eq_avg || 0,
                  eq_adaptability: score.faculty_ratings_detail?.eq_adaptability || score.faculty_eq_avg || 0,
                  eq_stress: score.faculty_ratings_detail?.eq_stress || score.faculty_eq_avg || 0,
                  eq_curiosity: score.faculty_ratings_detail?.eq_curiosity || score.faculty_eq_avg || 0,
                  eq_communication: score.faculty_ratings_detail?.eq_communication || score.faculty_eq_avg || 0,
                  // PQ attributes
                  pq_work_ethic: score.faculty_ratings_detail?.pq_work_ethic || score.faculty_pq_avg || 0,
                  pq_integrity: score.faculty_ratings_detail?.pq_integrity || score.faculty_pq_avg || 0,
                  pq_teachability: score.faculty_ratings_detail?.pq_teachability || score.faculty_pq_avg || 0,
                  pq_documentation: score.faculty_ratings_detail?.pq_documentation || score.faculty_pq_avg || 0,
                  pq_leadership: score.faculty_ratings_detail?.pq_leadership || score.faculty_pq_avg || 0,
                  // IQ attributes
                  iq_knowledge: score.faculty_ratings_detail?.iq_knowledge || score.faculty_iq_avg || 0,
                  iq_analytical: score.faculty_ratings_detail?.iq_analytical || score.faculty_iq_avg || 0,
                  iq_learning: score.faculty_ratings_detail?.iq_learning || score.faculty_iq_avg || 0,
                  iq_flexibility: score.faculty_ratings_detail?.iq_flexibility || score.faculty_iq_avg || 0,
                  iq_performance: score.faculty_ratings_detail?.iq_performance || score.faculty_iq_avg || 0,
                }}
                selfData={{
                  // EQ attributes
                  eq_empathy: score.self_ratings_detail?.eq_empathy || score.self_eq_avg || 0,
                  eq_adaptability: score.self_ratings_detail?.eq_adaptability || score.self_eq_avg || 0,
                  eq_stress: score.self_ratings_detail?.eq_stress || score.self_eq_avg || 0,
                  eq_curiosity: score.self_ratings_detail?.eq_curiosity || score.self_eq_avg || 0,
                  eq_communication: score.self_ratings_detail?.eq_communication || score.self_eq_avg || 0,
                  // PQ attributes
                  pq_work_ethic: score.self_ratings_detail?.pq_work_ethic || score.self_pq_avg || 0,
                  pq_integrity: score.self_ratings_detail?.pq_integrity || score.self_pq_avg || 0,
                  pq_teachability: score.self_ratings_detail?.pq_teachability || score.self_pq_avg || 0,
                  pq_documentation: score.self_ratings_detail?.pq_documentation || score.self_pq_avg || 0,
                  pq_leadership: score.self_ratings_detail?.pq_leadership || score.self_pq_avg || 0,
                  // IQ attributes
                  iq_knowledge: score.self_ratings_detail?.iq_knowledge || score.self_iq_avg || 0,
                  iq_analytical: score.self_ratings_detail?.iq_analytical || score.self_iq_avg || 0,
                  iq_learning: score.self_ratings_detail?.iq_learning || score.self_iq_avg || 0,
                  iq_flexibility: score.self_ratings_detail?.iq_flexibility || score.self_iq_avg || 0,
                  iq_performance: score.self_ratings_detail?.iq_performance || score.self_iq_avg || 0,
                }}
              />
            </div>
          )}

          {/* Gap Analysis */}
          {(score.self_faculty_gap_eq || score.self_faculty_gap_pq || score.self_faculty_gap_iq) && (
            <GapAnalysis
              gapEQ={score.self_faculty_gap_eq}
              gapPQ={score.self_faculty_gap_pq}
              gapIQ={score.self_faculty_gap_iq}
            />
          )}

          {/* Detailed Scores Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-md font-semibold text-neutral-800 mb-4">Detailed Scores</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-semibold text-neutral-700">Metric</th>
                    <th className="text-center py-2 px-4 font-semibold text-neutral-700">Faculty</th>
                    <th className="text-center py-2 px-4 font-semibold text-neutral-700">Self</th>
                    <th className="text-center py-2 px-4 font-semibold text-neutral-700">AI (Comments)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-neutral-800">EQ (Emotional)</td>
                    <td className="py-3 px-4 text-center">{score.faculty_eq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.self_eq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.ai_eq_avg?.toFixed(2) || '—'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-neutral-800">PQ (Professional)</td>
                    <td className="py-3 px-4 text-center">{score.faculty_pq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.self_pq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.ai_pq_avg?.toFixed(2) || '—'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-neutral-800">IQ (Intellectual)</td>
                    <td className="py-3 px-4 text-center">{score.faculty_iq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.self_iq_avg?.toFixed(2) || '—'}</td>
                    <td className="py-3 px-4 text-center">{score.ai_iq_avg?.toFixed(2) || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ITE Score (if available for this period) */}
          {score.ite_percentile && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-md font-semibold text-blue-800 mb-2">ITE Score</h4>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-blue-800">{score.ite_percentile}%</div>
                  <div className="text-sm text-blue-600">Percentile</div>
                </div>
                {score.ite_raw_score && (
                  <div>
                    <div className="text-2xl font-semibold text-blue-700">{score.ite_raw_score}</div>
                    <div className="text-sm text-blue-600">Raw Score</div>
                  </div>
                )}
                {score.ite_test_date && (
                  <div className="ml-auto text-sm text-blue-600">
                    Tested: {new Date(score.ite_test_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ITE History (if available) */}
      {iteScores.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-md font-semibold text-neutral-800 mb-4">ITE History</h4>
          <div className="space-y-2">
            {iteScores.map((ite) => (
              <div key={ite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-neutral-800">{ite.pgy_level} • {ite.academic_year}</div>
                  <div className="text-sm text-neutral-600">
                    {new Date(ite.test_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-neutral-800">{ite.percentile}%</div>
                  {ite.raw_score && (
                    <div className="text-sm text-neutral-600">{ite.raw_score} pts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


