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

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Auth Debugger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Server Side State */}
        <div className="bg-slate-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Server Side</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {user ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            {user && (
              <p><strong>User ID:</strong> <code className="text-xs bg-white p-1 rounded">{user.id}</code></p>
            )}
            {error && (
              <p className="text-red-500 text-sm"><strong>Error:</strong> {error.message}</p>
            )}
            
            <div className="mt-4">
              <p className="font-semibold mb-2">Cookies Received:</p>
              {allCookies.length === 0 ? (
                <p className="text-slate-500 italic">No cookies found</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {allCookies.map(c => (
                    <li key={c.name} className="break-all">
                      <span className="font-bold text-slate-600">{c.name}:</span> {c.value.substring(0, 20)}...
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Client Side State */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Client Side</h2>
          <ClientDebug />
        </div>
      </div>

      <div className="text-sm text-slate-500 mt-8">
        <p>Env Check:</p>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  );
}

