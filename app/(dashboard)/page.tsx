'use client';

import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}</h1>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <ul className="space-y-2">
            <li>
              <a href="/modules/grow/voice-journal" className="text-blue-600 hover:underline">
                Record Voice Journal
              </a>
            </li>
            <li>
              <a href="/settings" className="text-blue-600 hover:underline">
                Manage Profile
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Module Buckets</h2>
          <ul className="space-y-2">
            <li>
              <a href="/modules/learn" className="text-blue-600 hover:underline">
                Learn
              </a>
            </li>
            <li>
              <a href="/modules/grow" className="text-blue-600 hover:underline">
                Grow
              </a>
            </li>
            <li>
              <a href="/modules/understand" className="text-blue-600 hover:underline">
                Understand
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Resources</h2>
          <p className="text-sm text-slate-600">Documentation and guides coming soon</p>
        </div>
      </div>
    </div>
  );
}