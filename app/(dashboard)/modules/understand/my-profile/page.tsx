'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { 
  ArrowLeft, 
  TrendingUp, 
  FileText, 
  BookOpen,
  Award,
  Loader2,
  Lock
} from 'lucide-react';

interface ResidentData {
  id: string;
  full_name: string;
  anon_code: string;
  graduation_year: number;
  class_name: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [residentData, setResidentData] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyProfile() {
      if (!user?.id) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        // Get resident record linked to this user
        const { data: resident, error: residentError } = await supabaseClient
          .from('residents')
          .select(`
            id,
            anon_code,
            user_id,
            classes:class_id (
              graduation_year,
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (residentError || !resident) {
          // User is not a resident
          if (permissions.canViewAllResidents) {
            // Redirect faculty to residents list
            router.push('/modules/understand/residents');
            return;
          }
          setError('No resident profile found for your account');
          setLoading(false);
          return;
        }

        // Get user profile for name
        const { data: profile } = await supabaseClient
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        // Handle the classes join which could be an object or array depending on query result
        const classResult = resident.classes;
        const classData = Array.isArray(classResult) 
          ? classResult[0] as { graduation_year: number; name: string } | undefined
          : classResult as { graduation_year: number; name: string } | null;

        setResidentData({
          id: resident.id,
          full_name: profile?.full_name || 'Unknown',
          anon_code: resident.anon_code || '',
          graduation_year: classData?.graduation_year || 0,
          class_name: classData?.name || 'Unknown Class',
        });
      } catch (err) {
        console.error('[MyProfile] Error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchMyProfile();
  }, [user, permissions.canViewAllResidents, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#0EA5E9] mx-auto mb-4" />
          <p className="text-neutral-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !residentData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/modules/understand"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Understand
        </Link>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
          <Lock className="mx-auto text-neutral-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-neutral-800 mb-2">Profile Not Available</h2>
          <p className="text-neutral-600">{error || 'Unable to load your profile'}</p>
        </div>
      </div>
    );
  }

  // Calculate PGY level
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const pgyLevel = residentData.graduation_year - academicYear;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/modules/understand"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Understand
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A90A8] to-[#0EA5E9] flex items-center justify-center text-white text-2xl font-bold">
            {residentData.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">{residentData.full_name}</h1>
            <p className="text-neutral-600">
              PGY-{pgyLevel} • {residentData.class_name} • Class of {residentData.graduation_year}
            </p>
          </div>
        </div>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ITE Scores */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A90A8]/20 to-[#0EA5E9]/20 flex items-center justify-center">
              <Award className="text-[#4A90A8]" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">ITE Scores</h2>
          </div>
          <p className="text-neutral-500 text-sm">
            Your In-Training Exam scores and percentiles will appear here.
          </p>
          {/* TODO: Add ITE score component */}
        </div>

        {/* SWOT Analysis */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20 flex items-center justify-center">
              <TrendingUp className="text-[#4ECDC4]" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">SWOT Analysis</h2>
          </div>
          <p className="text-neutral-500 text-sm">
            Your strengths, weaknesses, opportunities, and threats summary.
          </p>
          {/* TODO: Add SWOT component */}
        </div>

        {/* Evaluations */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7EC8E3]/20 to-[#95E1D3]/20 flex items-center justify-center">
              <FileText className="text-[#7EC8E3]" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">Evaluations</h2>
          </div>
          <p className="text-neutral-500 text-sm">
            Faculty evaluations and feedback from rotations.
          </p>
          {/* TODO: Add evaluations component */}
        </div>

        {/* Learning Progress */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9]/20 to-[#4A90A8]/20 flex items-center justify-center">
              <BookOpen className="text-[#0EA5E9]" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">Learning Progress</h2>
          </div>
          <p className="text-neutral-500 text-sm">
            ROSH Review progress and study metrics.
          </p>
          {/* TODO: Add learning progress component */}
        </div>
      </div>

      {/* Note about data visibility */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This page shows your personal performance data. 
          Class and program-wide averages are available in the Class Cohort and Program-Wide sections 
          to help you understand how you compare to your peers.
        </p>
      </div>
    </div>
  );
}

