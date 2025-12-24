'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export function ClientDebug() {
  const [status, setStatus] = useState('Checking...');
  const [user, setUser] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        setStatus('Error: ' + error.message);
      } else if (data.session) {
        setStatus('✅ Authenticated');
        setUser(data.session.user);
      } else {
        setStatus('❌ No Session');
      }
      
      setCookies(document.cookie);
    };
    
    check();
  }, []);

  return (
    <div className="space-y-2">
      <p><strong>Status:</strong> {status}</p>
      {user && (
        <p><strong>User ID:</strong> <code className="text-xs bg-white p-1 rounded">{user.id}</code></p>
      )}
      <div className="mt-4">
        <p className="font-semibold mb-2">Browser Cookies:</p>
        <pre className="text-xs bg-white p-2 rounded overflow-auto h-32 break-all whitespace-pre-wrap">
          {cookies || 'No cookies accessible to JS'}
        </pre>
      </div>
    </div>
  );
}

