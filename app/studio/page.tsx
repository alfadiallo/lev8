'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  MessageSquare,
  Activity,
  Stethoscope,
  Plus,
  TrendingUp,
  Eye,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ContentStats {
  total: number;
  published: number;
  drafts: number;
  views: number;
}

const contentTypes = [
  {
    id: 'running-board',
    name: 'Running Board Cases',
    description: 'Create multi-patient ED simulation scenarios',
    icon: BookOpen,
    href: '/studio/content/running-board',
    color: 'from-emerald-500 to-teal-500',
    createHref: '/studio/content/running-board/new'
  },
  {
    id: 'clinical-cases',
    name: 'Clinical Cases',
    description: 'Build interactive clinical case studies',
    icon: Stethoscope,
    href: '/studio/content/clinical-cases',
    color: 'from-blue-500 to-cyan-500',
    createHref: '/studio/content/clinical-cases/new'
  },
  {
    id: 'conversations',
    name: 'Difficult Conversations',
    description: 'Design challenging communication scenarios',
    icon: MessageSquare,
    href: '/studio/content/conversations',
    color: 'from-purple-500 to-pink-500',
    createHref: '/studio/content/conversations/new'
  },
  {
    id: 'ekg-scenarios',
    name: 'EKG Scenarios',
    description: 'Create EKG interpretation exercises',
    icon: Activity,
    href: '/studio/content/ekg-scenarios',
    color: 'from-red-500 to-orange-500',
    createHref: '/studio/content/ekg-scenarios/new'
  },
];

export default function StudioDashboard() {
  const _auth = useAuth();
  const [stats, setStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0
  });
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // TODO: Fetch actual stats from API
    setStats({
      total: 0,
      published: 0,
      drafts: 0,
      views: 0
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--theme-text)' }}>
            {greeting}, Creator
            <Sparkles className="w-7 h-7" style={{ color: 'var(--theme-primary)' }} />
          </h1>
          <p className="mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Create and share educational content for medical residency programs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Content', value: stats.total, icon: BookOpen },
          { label: 'Published', value: stats.published, icon: Star },
          { label: 'Drafts', value: stats.drafts, icon: TrendingUp },
          { label: 'Total Views', value: stats.views, icon: Eye },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="p-4 rounded-xl"
              style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: 'var(--theme-primary)' }} />
                <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Content Types Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>Create Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
              >
                {/* Gradient accent */}
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${type.color}`}
                />
                
                <div className="flex items-start gap-4">
                  <div 
                    className={`p-3 rounded-xl bg-gradient-to-br ${type.color}`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                      {type.name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                      {type.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--theme-border-solid)' }}>
                  <Link
                    href={type.createHref}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
                  >
                    <Plus size={16} />
                    Create New
                  </Link>
                  <Link
                    href={type.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    View All
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div 
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, var(--theme-primary-soft) 0%, var(--theme-surface-hover) 100%)', border: '1px solid var(--theme-border-solid)' }}
      >
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          <Sparkles size={20} style={{ color: 'var(--theme-primary)' }} />
          Getting Started with Studio
        </h2>
        <p className="mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          Studio is where you create educational content that programs can use. Your content goes through a review process before being published to the global library.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--theme-surface-solid)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary-soft)' }}>
              <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>1</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Create Content</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Choose a content type and build your educational material</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--theme-surface-solid)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary-soft)' }}>
              <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>2</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Edit & Publish</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Edit before and then share with the community</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--theme-surface-solid)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary-soft)' }}>
              <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>3</span>
            </div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Collaborate</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Improve and grow the community&apos;s content</p>
          </div>
        </div>
      </div>
    </div>
  );
}
