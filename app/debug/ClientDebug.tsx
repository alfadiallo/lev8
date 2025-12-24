'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export function ClientDebug() {
  const [getSessionStatus, setGetSessionStatus] = useState('Checking...');
  const [getUserStatus, setGetUserStatus] = useState('Checking...');
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string>('');
  const [cookieDetails, setCookieDetails] = useState<Array<{name: string, value: string, httpOnly: boolean}>>([]);

  useEffect(() => {
    const check = async () => {
      // Check cookies
      setCookies(document.cookie);
      
      // Parse cookies to check httpOnly (we can't read httpOnly cookies, but we can see what's accessible)
      const cookieList = document.cookie.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { name, value: value || '', httpOnly: false }; // If we can read it, it's not httpOnly
      });
      setCookieDetails(cookieList);

      // Check getSession
      try {
        const { data: sessionData, error: sessionErr } = await supabaseClient.auth.getSession();
        
        if (sessionErr) {
          setGetSessionStatus('❌ Error');
          setSessionError(sessionErr.message);
        } else if (sessionData.session) {
          setGetSessionStatus('✅ Has Session');
          setSession(sessionData.session);
        } else {
          setGetSessionStatus('❌ No Session');
        }
      } catch (e: any) {
        setGetSessionStatus('❌ Exception');
        setSessionError(e.message);
      }

      // Check getUser
      try {
        const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
        
        if (userErr) {
          setGetUserStatus('❌ Error');
          setUserError(userErr.message);
        } else if (userData.user) {
          setGetUserStatus('✅ Authenticated');
          setUser(userData.user);
        } else {
          setGetUserStatus('❌ No User');
        }
      } catch (e: any) {
        setGetUserStatus('❌ Exception');
        setUserError(e.message);
      }
    };
    
    check();
  }, []);

  const supabaseCookies = cookieDetails.filter(c => c.name.includes('sb-'));
  const authCookie = cookieDetails.find(c => c.name.includes('auth-token'));

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-bold">getSession() Status:</p>
        <p className={getSessionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
          {getSessionStatus}
        </p>
        {sessionError && (
          <p className="text-red-500 text-xs mt-1"><strong>Error:</strong> {sessionError}</p>
        )}
        {session && (
          <div className="text-xs mt-2 space-y-1 bg-white p-2 rounded">
            <p><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            <p><strong>Access Token:</strong> {session.access_token.substring(0, 20)}...</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-blue-200">
        <p className="font-bold">getUser() Status:</p>
        <p className={getUserStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
          {getUserStatus}
        </p>
        {userError && (
          <p className="text-red-500 text-xs mt-1"><strong>Error:</strong> {userError}</p>
        )}
        {user && (
          <p className="text-xs mt-1">
            <strong>User ID:</strong> <code className="bg-white p-1 rounded">{user.id}</code>
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-blue-200">
        <p className="font-bold mb-2">Browser Cookies ({cookieDetails.length}):</p>
        {cookieDetails.length === 0 ? (
          <p className="text-red-500">⚠️ No cookies accessible to JS</p>
        ) : (
          <div className="space-y-2 text-xs">
            {cookieDetails.map((c, i) => (
              <div key={i} className="bg-white p-2 rounded border">
                <p className="font-bold text-blue-600">{c.name}</p>
                <p className="break-all text-blue-500">{c.value.substring(0, 50)}...</p>
                <p className="text-blue-400 mt-1">Not httpOnly (JS readable)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-blue-200">
        <p className="font-bold mb-2">Supabase Cookies ({supabaseCookies.length}):</p>
        {supabaseCookies.length === 0 ? (
          <p className="text-red-500">⚠️ No Supabase cookies accessible to JS!</p>
        ) : (
          <div className="space-y-2 text-xs">
            {supabaseCookies.map((c, i) => (
              <div key={i} className="bg-white p-2 rounded border">
                <p className="font-bold text-blue-600">{c.name}</p>
                <p className="break-all text-blue-500">{c.value.substring(0, 50)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {authCookie ? (
        <div className="pt-4 border-t border-blue-200 bg-green-50 p-3 rounded">
          <p className="font-bold text-green-800">🔑 Auth Token Cookie Found (JS readable):</p>
          <p className="text-xs text-green-700 mt-1">{authCookie.name}</p>
          <p className="text-xs text-green-600 mt-1">Length: {authCookie.value.length} chars</p>
        </div>
      ) : (
        <div className="pt-4 border-t border-blue-200 bg-red-50 p-3 rounded">
          <p className="font-bold text-red-800">⚠️ Auth Token Cookie NOT Found (JS readable)</p>
          <p className="text-xs text-red-700 mt-1">This means the cookie is httpOnly or not set</p>
        </div>
      )}

      <div className="pt-4 border-t border-blue-200">
        <p className="font-bold mb-2">Raw document.cookie:</p>
        <pre className="text-xs bg-white p-2 rounded overflow-auto h-32 break-all whitespace-pre-wrap">
          {cookies || 'No cookies accessible to JS'}
        </pre>
      </div>
    </div>
  );
}
