// Competencies Tab Component
// Placeholder for ACGME competency tracking (future feature)

'use client';

import { 
  ClipboardList, 
  Heart, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Shield, 
  Building2 
} from 'lucide-react';

export default function CompetenciesTab() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <ClipboardList size={64} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">
        Competencies Module
      </h3>
      <p className="text-neutral-600 max-w-md mx-auto">
        ACGME competency tracking and milestone progression will be available in a future release.
      </p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <Heart size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Patient Care</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <BookOpen size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Medical Knowledge</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <GraduationCap size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Practice-Based Learning</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <Users size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Interpersonal Skills</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <Shield size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Professionalism</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <Building2 size={24} className="text-gray-400 mb-2" />
          <div className="font-semibold text-neutral-800">Systems-Based Practice</div>
          <div className="text-neutral-500 text-xs mt-1">Coming Soon</div>
        </div>
      </div>
    </div>
  );
}


