'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export default function ResetPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing reset...');

  useEffect(() => {
    const resetApp = async () => {
      try {
        setStatus('Clearing local storage...');
        // 1. Clear LocalStorage
        localStorage.clear();
        sessionStorage.clear();

        setStatus('Signing out from Supabase...');
        // 2. Force sign out
        await supabaseClient.auth.signOut();

        // 3. Clear cookies (rudimentary check)
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setStatus('Done! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);

      } catch (error) {
        console.error('Reset failed:', error);
        setStatus('Error during reset. Please manually clear site data.');
      }
    };

    resetApp();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE5D9] p-4">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#0EA5E9]">Resetting Application</h1>
        <div className="mb-4">
          <div className="w-8 h-8 border-4 border-[#7EC8E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-neutral-600">{status}</p>
      </div>
    </div>
  );
}




