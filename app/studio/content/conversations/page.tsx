'use client';

import { MessageSquare } from 'lucide-react';

export default function ConversationsPage() {
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
          <MessageSquare size={40} style={{ color: 'var(--theme-primary)' }} />
        </div>
        
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--theme-text)' }}>
          Difficult Conversations
        </h1>
        
        <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--theme-text-muted)' }}>
          Design conversation simulations for practicing challenging patient and family discussions, including breaking bad news and end-of-life care.
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
