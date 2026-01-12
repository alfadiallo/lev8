'use client';

import Link from 'next/link';
import { useTenantUrl } from '@/context/TenantContext';
import {
  BookOpen,
  MessageSquare,
  Activity,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

const learnModules = [
  {
    id: 'clinical-cases',
    name: 'Clinical Cases',
    description: 'Interactive clinical case studies with realistic patient presentations',
    icon: Stethoscope,
    path: '/modules/learn/clinical-cases',
    color: 'from-blue-500 to-cyan-500',
    status: 'active'
  },
  {
    id: 'difficult-conversations',
    name: 'Difficult Conversations',
    description: 'Practice challenging patient and family conversations',
    icon: MessageSquare,
    path: '/modules/learn/difficult-conversations',
    color: 'from-purple-500 to-pink-500',
    status: 'active'
  },
  {
    id: 'ekg-acls',
    name: 'EKG & ACLS',
    description: 'EKG interpretation and ACLS scenarios',
    icon: Activity,
    path: '/modules/learn/ekg-acls',
    color: 'from-red-500 to-orange-500',
    status: 'active'
  },
  {
    id: 'running-board',
    name: 'Running the Board',
    description: 'Multi-patient ED management simulation',
    icon: BookOpen,
    path: '/modules/learn/running-board',
    color: 'from-emerald-500 to-teal-500',
    status: 'active'
  },
];

export default function TenantLearnPage() {
  const { buildUrl } = useTenantUrl();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Learn
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Interactive learning modules to enhance your clinical skills
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {learnModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.id}
              href={buildUrl(module.path)}
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              style={{
                background: 'var(--theme-surface-solid)',
                border: '1px solid var(--theme-border-solid)',
              }}
            >
              {/* Gradient accent */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color}`}
              />
              
              <div className="flex items-start gap-4">
                <div 
                  className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 
                    className="font-bold text-lg flex items-center gap-2"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {module.name}
                    <ArrowRight 
                      className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" 
                      style={{ color: 'var(--theme-primary)' }}
                    />
                  </h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
