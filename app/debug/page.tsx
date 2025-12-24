import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ClientDebug } from './ClientDebug';

export default async function DebugPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll(cookiesToSet) {
          // No-op for debug view
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Analyze cookies
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'));
  const authCookie = allCookies.find(c => c.name.includes('auth-token'));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">🔍 Auth Debugger (Enhanced)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Server Side State */}
        <div className="bg-slate-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Server Side</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold">getUser() Status:</p>
              <p className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? '✅ Authenticated' : '❌ Not Authenticated'}
              </p>
              {user && (
                <p className="text-xs mt-1">
                  <strong>User ID:</strong> <code className="bg-white p-1 rounded">{user.id}</code>
                </p>
              )}
              {error && (
                <p className="text-red-500 text-xs mt-1"><strong>Error:</strong> {error.message}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-300">
              <p className="font-bold">getSession() Status:</p>
              <p className={session ? 'text-green-600' : 'text-red-600'}>
                {session ? '✅ Has Session' : '❌ No Session'}
              </p>
              {sessionError && (
                <p className="text-red-500 text-xs mt-1"><strong>Error:</strong> {sessionError.message}</p>
              )}
              {session && (
                <div className="text-xs mt-2 space-y-1">
                  <p><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
                  <p><strong>Access Token:</strong> {session.access_token.substring(0, 20)}...</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-300">
              <p className="font-bold mb-2">All Cookies ({allCookies.length}):</p>
              {allCookies.length === 0 ? (
                <p className="text-slate-500 italic">No cookies found</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {allCookies.map(c => (
                    <div key={c.name} className="bg-white p-2 rounded border">
                      <p className="font-bold text-slate-600">{c.name}</p>
                      <p className="break-all text-slate-500">{c.value.substring(0, 50)}...</p>
                      <p className="text-slate-400 mt-1">Value length: {c.value.length} chars</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-300">
              <p className="font-bold mb-2">Supabase Cookies ({supabaseCookies.length}):</p>
              {supabaseCookies.length === 0 ? (
                <p className="text-red-500">⚠️ No Supabase cookies found!</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {supabaseCookies.map(c => (
                    <div key={c.name} className="bg-white p-2 rounded border">
                      <p className="font-bold text-slate-600">{c.name}</p>
                      <p className="break-all text-slate-500">{c.value.substring(0, 50)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {authCookie && (
              <div className="mt-4 pt-4 border-t border-slate-300 bg-yellow-50 p-3 rounded">
                <p className="font-bold text-yellow-800">🔑 Auth Token Cookie Found:</p>
                <p className="text-xs text-yellow-700 mt-1">{authCookie.name}</p>
                <p className="text-xs text-yellow-600 mt-1">Length: {authCookie.value.length} chars</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Side State */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Client Side</h2>
          <ClientDebug />
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-green-800">Environment Check</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong></p>
            <p className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <p className="text-xs text-slate-500 mt-1">{process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            )}
          </div>
          <div>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong></p>
            <p className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <p className="text-xs text-slate-500 mt-1">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
