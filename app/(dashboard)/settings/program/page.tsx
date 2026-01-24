'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ProgramData {
  name: string;
  specialty: string;
  health_system: string;
  residents: Array<{
    id: string;
    full_name: string;
    email: string;
    class_year: string;
  }>;
  faculty: Array<{
    id: string;
    full_name: string;
    email: string;
    title: string;
  }>;
}

export default function ProgramSettingsPage() {
  const { user } = useAuth();
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'program_director' || user?.role === 'super_admin') {
      fetchProgramData();
    } else {
      setError('You do not have permission to view this page');
      setIsLoading(false);
    }
  }, [user]);

  const fetchProgramData = async () => {
    try {
      const response = await fetch('/api/users/directory');
      if (!response.ok) {
        throw new Error('Failed to fetch program data');
      }
      const data = await response.json();
      setProgramData(data.program);
    } catch (err) {
      console.error('Error fetching program data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (user.role !== 'program_director' && user.role !== 'super_admin')) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">⚠️ Access Denied</div>
        <p className="text-slate-600">
          You do not have permission to view program settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading program information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-semibold text-yellow-900">Program Data Not Available</h3>
        </div>
        <p className="text-yellow-800 mb-4">{error}</p>
        <p className="text-sm text-yellow-700">
          This feature requires program data to be set up in the database. 
          The API endpoint will be created in task 1.9.5.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Program Information */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Program Information</h2>
        
        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-500">Program Name</div>
            <div className="mt-1 text-lg text-slate-900">
              {programData?.name || 'Emergency Medicine Residency'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Specialty</div>
            <div className="mt-1 text-slate-900">
              {programData?.specialty || 'Emergency Medicine'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Health System</div>
            <div className="mt-1 text-slate-900">
              {programData?.health_system || 'Memorial Hospital West'}
            </div>
          </div>
        </div>
      </section>

      {/* Residents Directory */}
      <section className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Residents</h2>
        <p className="text-sm text-slate-600 mb-6">
          View and manage residents in your program
        </p>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Class Year
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {programData?.residents && programData.residents.length > 0 ? (
                programData.residents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {resident.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {resident.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {resident.class_year}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                    No residents found. Data will be loaded from the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Faculty Directory */}
      <section className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Faculty</h2>
        <p className="text-sm text-slate-600 mb-6">
          View and manage faculty in your program
        </p>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Title
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {programData?.faculty && programData.faculty.length > 0 ? (
                programData.faculty.map((facultyMember) => (
                  <tr key={facultyMember.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {facultyMember.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {facultyMember.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {facultyMember.title}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                    No faculty found. Data will be loaded from the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Module Management */}
      <section className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Module Management</h2>
        <p className="text-sm text-slate-600 mb-6">
          Manage module availability and settings for your program
        </p>

        <div className="space-y-4">
          {['Learn', 'Reflect', 'Understand'].map((bucket) => (
            <div key={bucket} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{bucket} Module</div>
                <div className="text-sm text-slate-600">
                  {bucket === 'Reflect' ? 'Voice Journal enabled' : 'Coming soon'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  bucket === 'Reflect' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {bucket === 'Reflect' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

