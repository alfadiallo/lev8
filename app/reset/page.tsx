'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export default function ResetPage() {
  const [status, setStatus] = useState('Initializing reset...');

  useEffect(() => {
    const resetApp = async () => {
      try {
        setStatus('Clearing local storage...');
        // 1. Clear LocalStorage
        localStorage.clear();
        sessionStorage.clear();

        setStatus('Signing out from Supabase...');
        // 2. Force sign out with timeout (don't let it hang)
        try {
          const signOutPromise = supabaseClient.auth.signOut();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          await Promise.race([signOutPromise, timeoutPromise]);
        } catch (e) {
          console.log('Sign out timeout or error, continuing anyway:', e);
        }

        setStatus('Clearing cookies...');
        // 3. Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setStatus('Done! Redirecting to login...');
        // Use window.location for a full page reload
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);

      } catch (error) {
        console.error('Reset failed:', error);
        setStatus('Redirecting anyway...');
        // Even if there's an error, redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
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





