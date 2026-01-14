'use client';

import { Stethoscope } from 'lucide-react';

export default function ClinicalCasesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div 
        className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
        style={{ 
          background: 'var(--theme-surface-solid)',
          border: '1px solid var(--theme-border-solid)'
        }}
      >
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'var(--theme-primary-soft)' }}
        >
          <Stethoscope size={40} style={{ color: 'var(--theme-primary)' }} />
        </div>
        
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text)' }}>
          Clinical Cases
        </h1>
        
        <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--theme-text-muted)' }}>
          Create and manage interactive clinical case scenarios for residents to practice diagnostic reasoning and clinical decision-making.
        </p>
        
        <span 
          className="text-sm font-medium px-4 py-2 rounded-full"
          style={{ 
            background: 'var(--theme-primary-soft)', 
            color: 'var(--theme-primary)' 
          }}
        >
          Coming Soon
        </span>
      </div>
    </div>
  );
}
