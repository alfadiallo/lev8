// Learn Module - Overview page

'use client';

import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import Link from 'next/link';
import { Stethoscope, MessageSquare, Activity, Users } from 'lucide-react';

export default function LearnModulePage() {
  return (
    <ModuleGuard
      availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}
    >
      <ModuleLayout
        title="Learn"
        description="Expand your clinical knowledge and skills through interactive learning modules"
        backHref="/"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Clinical Cases */}
          <Link
            href="/modules/learn/clinical-cases"
            className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#86C5A8]/20 rounded-xl group-hover:bg-[#86C5A8]/30 transition-colors">
                <Stethoscope className="text-[#86C5A8]" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2 text-neutral-800">Clinical Cases</h3>
                <p className="text-neutral-600 mb-4">
                  Practice with real clinical scenarios and patient cases
                </p>
                <span className="text-[#7EC8E3] font-medium text-sm group-hover:text-[#5BA8C4] transition-colors">
                  Start Learning →
                </span>
              </div>
            </div>
          </Link>

          {/* Difficult Conversations */}
          <Link
            href="/modules/learn/difficult-conversations"
            className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#FFB5A7]/20 rounded-xl group-hover:bg-[#FFB5A7]/30 transition-colors">
                <MessageSquare className="text-[#FFB5A7]" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2 text-neutral-800">Difficult Conversations</h3>
                <p className="text-neutral-600 mb-4">
                  Practice essential communication skills for challenging medical situations
                </p>
                <span className="text-[#7EC8E3] font-medium text-sm group-hover:text-[#5BA8C4] transition-colors">
                  Start Learning →
                </span>
              </div>
            </div>
          </Link>

          {/* EKG & ACLS */}
          <Link
            href="/modules/learn/ekg-acls"
            className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#7EC8E3]/20 rounded-xl group-hover:bg-[#7EC8E3]/30 transition-colors">
                <Activity className="text-[#7EC8E3]" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2 text-neutral-800">EKG & ACLS</h3>
                <p className="text-neutral-600 mb-4">
                  Advanced cardiac life support training with interactive EKG simulations
                </p>
                <span className="text-[#7EC8E3] font-medium text-sm group-hover:text-[#5BA8C4] transition-colors">
                  Start Learning →
                </span>
              </div>
            </div>
          </Link>

          {/* Running the Board */}
          <Link
            href="/modules/learn/running-board"
            className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#FFD89B]/20 rounded-xl group-hover:bg-[#FFD89B]/30 transition-colors">
                <Users className="text-[#FFD89B]" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2 text-neutral-800">Running the Board</h3>
                <p className="text-neutral-600 mb-4">
                  Multi-patient emergency department simulation
                </p>
                <span className="text-[#7EC8E3] font-medium text-sm group-hover:text-[#5BA8C4] transition-colors">
                  Start Learning →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </ModuleLayout>
    </ModuleGuard>
  );
}


