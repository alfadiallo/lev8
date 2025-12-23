'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import D3RadarChart from '@/components/charts/D3RadarChart';
import D3SlopeChart from '@/components/charts/D3SlopeChart';
import D3DualLineChart from '@/components/charts/D3DualLineChart';
import { CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPGYLevel } from '@/lib/utils/pgy-calculator';

interface OverviewPaneProps {
  residentId: string;
  residentName: string;
  anonCode: string;
  pgyLevel: number;
}

interface ITEDataPoint {
  pgy: number;
  score: number;
  percentile: number;
  rank?: number;
  classAvg: number;
}

interface RoshDataPoint {
  period: string;
  completion: number | null;
  accuracy: number | null;
}

interface ClassAverage {
  pgy: number;
  percentile: number;
  score: number;
}

export default function OverviewPane({ residentId, residentName, anonCode, pgyLevel }: OverviewPaneProps) {
  const [loading, setLoading] = useState(true);
  const [iteData, setIteData] = useState<ITEDataPoint[]>([]);
  const [classAverages, setClassAverages] = useState<ClassAverage[]>([]);
  const [roshData, setRoshData] = useState<RoshDataPoint[]>([]);
  const [currentRoshPeriod, setCurrentRoshPeriod] = useState<string>('');

  useEffect(() => {
    fetchResidentData();
  }, [residentId]);

  const fetchResidentData = async () => {
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[Overview] Query timeout - showing empty state');
      setLoading(false);
    }, 8000); // 8 second timeout
    
    try {
      // 1. Fetch ITE Scores with class statistics (using optimized view)
      // Try the view first, fall back to basic table if view doesn't exist
      let iteScores: any[] = [];
      let useView = true;
      
      const { data: viewData, error: viewError } = await supabaseClient
        .from('ite_scores_with_rank')
        .select('*')
        .eq('resident_id', residentId)
        .order('pgy_level', { ascending: true });
      
      if (viewError) {
        console.log('[Overview] View not available, using basic query:', viewError.message);
        useView = false;
        
        // Fallback to basic ite_scores table
        const { data: basicData, error: basicError } = await supabaseClient
          .from('ite_scores')
          .select('*')
          .eq('resident_id', residentId)
          .order('pgy_level', { ascending: true });
        
        if (basicError) {
          console.log('[Overview] ITE query error:', basicError.message);
        }
        iteScores = basicData || [];
      } else {
        iteScores = viewData || [];
      }

      // Process ITE scores
      const processedIte: ITEDataPoint[] = iteScores.map(score => {
        // Extract PGY level as number (handle both "1" and "PGY-1" formats)
        const pgyStr = String(score.pgy_level || '0');
        const pgy = parseInt(pgyStr.replace(/\D/g, '')) || 0;
        
        return {
          pgy,
          score: score.raw_score || 0,
          percentile: score.percentile || 0,
          rank: useView ? score.class_rank : undefined,
          classAvg: useView ? Math.round(score.class_avg_percentile || 50) : 50
        };
      });
      
      // Build class averages from the view data
      const avgData: ClassAverage[] = [];
      const seenPGY = new Set<number>();
      for (const score of iteScores) {
        const pgyStr = String(score.pgy_level || '0');
        const pgy = parseInt(pgyStr.replace(/\D/g, '')) || 0;
        if (!seenPGY.has(pgy) && useView) {
          seenPGY.add(pgy);
          avgData.push({
            pgy,
            percentile: Math.round(score.class_avg_percentile || 50),
            score: Math.round(score.class_avg_score || 0)
          });
        }
      }

      setIteData(processedIte);
      setClassAverages(avgData.sort((a, b) => a.pgy - b.pgy));

      // 2. Fetch ROSH snapshots by semester
      const { data: roshSnapshots, error: roshError } = await supabaseClient
        .from('rosh_completion_snapshots')
        .select('*')
        .eq('resident_id', residentId)
        .order('pgy_level', { ascending: true })
        .order('semester', { ascending: true });
      
      if (roshError) {
        console.log('[Overview] ROSH query error:', roshError.message);
      }

      // Process ROSH data into period format
      const roshByPeriod: RoshDataPoint[] = [];
      const periods = ['F1', 'S1', 'F2', 'S2', 'F3', 'S3'];
      
      for (const snapshot of roshSnapshots || []) {
        const pgy = snapshot.pgy_level?.replace('PGY-', '') || snapshot.pgy_level;
        const semester = snapshot.semester;
        let period = '';
        
        if (semester === 'Fall') {
          period = `F${pgy}`;
        } else if (semester === 'Spring') {
          period = `S${pgy}`;
        }

        if (period && periods.includes(period)) {
          roshByPeriod.push({
            period,
            completion: snapshot.completion_percentage || null,
            accuracy: snapshot.accuracy_percentage || null
          });
        }
      }

      setRoshData(roshByPeriod);

      // Determine current period based on PGY level and current month
      const currentMonth = new Date().getMonth();
      const isFall = currentMonth >= 6; // July onwards is Fall
      const currentPeriodLabel = isFall ? `F${pgyLevel}` : `S${pgyLevel}`;
      setCurrentRoshPeriod(currentPeriodLabel);

    } catch (err) {
      console.error('[Overview] Error fetching data:', err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  // Calculate trajectory indicator
  const getTrajectory = () => {
    if (iteData.length < 2) return 'neutral';
    const sorted = [...iteData].sort((a, b) => a.pgy - b.pgy);
    const first = sorted[0].percentile;
    const last = sorted[sorted.length - 1].percentile;
    if (last > first + 5) return 'up';
    if (last < first - 5) return 'down';
    return 'neutral';
  };

  const trajectory = getTrajectory();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">{residentName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] text-sm font-medium rounded">
                  {formatPGYLevel(pgyLevel)}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-500 font-mono text-sm">{anonCode}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-neutral-500">Trajectory</p>
            <div className={`flex items-center gap-1 font-medium ${
              trajectory === 'up' ? 'text-green-600' :
              trajectory === 'down' ? 'text-red-500' : 'text-neutral-500'
            }`}>
              {trajectory === 'up' && <TrendingUp size={16} />}
              {trajectory === 'down' && <TrendingDown size={16} />}
              {trajectory === 'neutral' && <Minus size={16} />}
              <span>{trajectory === 'up' ? 'Improving' : trajectory === 'down' ? 'Declining' : 'Stable'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ITE Progression Hero Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-800">ITE Progression</h3>
          <p className="text-sm text-neutral-500 mt-1">In-Training Exam performance across PGY years</p>
        </div>
        
        <div className="p-6">
          {iteData.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Slope Chart */}
              <div className="flex-1 flex justify-center">
                <D3SlopeChart
                  residentData={iteData.map(d => ({
                    pgy: d.pgy,
                    percentile: d.percentile,
                    score: d.score,
                    rank: d.rank
                  }))}
                  classAverages={classAverages}
                  residentName={residentName}
                  width={420}
                  height={260}
                />
              </div>
              
              {/* Stats Cards */}
              <div className="flex lg:flex-col gap-3 justify-center">
                {[1, 2, 3].map(pgy => {
                  const data = iteData.find(d => d.pgy === pgy);
                  const avgData = classAverages.find(a => a.pgy === pgy);
                  const isProjected = !data && iteData.length >= 2;
                  
                  return (
                    <div 
                      key={pgy}
                      className={`p-4 rounded-xl border ${
                        data ? 'bg-white border-neutral-200' : 
                        isProjected ? 'bg-neutral-50 border-dashed border-neutral-300' :
                        'bg-neutral-50 border-neutral-100'
                      } min-w-[120px]`}
                    >
                      <div className="text-xs font-semibold text-neutral-400 uppercase mb-2">
                        PGY-{pgy} {isProjected && '(Proj)'}
                      </div>
                      {data ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Score:</span>
                            <span className="font-bold text-neutral-800">{data.score}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">%ile:</span>
                            <span className={`font-bold ${data.percentile >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                              {data.percentile}
                            </span>
                          </div>
                          {data.rank && (
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-500">Rank:</span>
                              <span className="font-bold text-neutral-800">#{data.rank}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-1 border-t border-neutral-100 mt-1">
                            <span className="text-neutral-400">Avg:</span>
                            <span className="text-neutral-500">{data.classAvg || avgData?.percentile || '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-neutral-400 text-sm py-2">
                          {isProjected ? '~' : '-'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400">
              No ITE data available
            </div>
          )}
        </div>
      </div>

      {/* ROSH Progress Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-800">ROSH Review Progress</h3>
          <p className="text-sm text-neutral-500 mt-1">Question bank completion and accuracy over 6 semesters</p>
        </div>
        
        <div className="p-6">
          {roshData.length > 0 ? (
            <div className="flex justify-center">
              <D3DualLineChart
                data={roshData}
                currentPeriod={currentRoshPeriod}
                width={520}
                height={220}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400">
              <p>No ROSH data available</p>
              <p className="text-xs mt-2">Data will appear after semester snapshots are recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Competency Radar + SWOT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Competency Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">Competency Profile</h3>
          <div className="flex justify-center">
            <D3RadarChart 
              data={[
                { subject: 'Patient Care', value: 85, fullMark: 100 },
                { subject: 'Medical Knowledge', value: 78, fullMark: 100 },
                { subject: 'System-Based Practice', value: 65, fullMark: 100 },
                { subject: 'PBL & I', value: 72, fullMark: 100 },
                { subject: 'Professionalism', value: 90, fullMark: 100 },
                { subject: 'Interpersonal Comm', value: 88, fullMark: 100 },
              ]}
              width={320}
              height={280}
            />
          </div>
        </div>

        {/* SWOT Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">SWOT Summary</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">Strengths</h4>
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
                Strong clinical knowledge, excellent patient rapport
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Weaknesses</h4>
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
                Efficiency in fast track, documentation timeliness
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Opportunities</h4>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Ultrasound fellowship interest, research involvement
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-2">Threats</h4>
              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                Work-life balance, burnout risk during PGY-2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
