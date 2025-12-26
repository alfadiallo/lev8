import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ClientDebug } from './ClientDebug';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get build metadata
async function getBuildInfo() {
  let gitCommit = 'unknown';
  let gitMessage = 'unknown';
  let buildTime = new Date().toISOString();
  let version = '0.1.0';
  let nextVersion = '15.5.9';
  
  try {
    // Read package.json
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    version = packageJson.version || '0.1.0';
    nextVersion = packageJson.dependencies?.next || '15.5.9';
  } catch (e) {
    // Use defaults
  }

  try {
    // Try to read from .next/BUILD_ID
    const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID');
    const buildId = readFileSync(buildIdPath, 'utf-8').trim();
    if (buildId) {
      gitCommit = buildId.substring(0, 7); // Use first 7 chars as short hash
    }
  } catch (e) {
    // Fallback to environment variables
  }

  // Try to get from environment (Vercel provides this)
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    gitCommit = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  }
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
    gitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE;
  }

  return {
    version,
    nextVersion,
    gitCommit,
    gitMessage,
    buildTime,
    environment: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'local',
    nodeVersion: process.version,
  };
}

export default async function DebugPage() {
  const buildInfo = await getBuildInfo();
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
        setAll(_cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
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
      
      {/* Build Metadata */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
        <h2 className="text-xl font-semibold mb-4 text-purple-800 flex items-center gap-2">
          <span>📦</span> Build Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Package Version</p>
            <p className="text-purple-900 font-mono">{buildInfo.version}</p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Next.js Version</p>
            <p className="text-purple-900 font-mono">{buildInfo.nextVersion}</p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Git Commit</p>
            <p className="text-purple-900 font-mono">{buildInfo.gitCommit}</p>
            {buildInfo.gitMessage !== 'unknown' && (
              <p className="text-xs text-purple-600 mt-1 truncate" title={buildInfo.gitMessage}>
                {buildInfo.gitMessage}
              </p>
            )}
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Build Time</p>
            <p className="text-purple-900 font-mono text-xs">{new Date(buildInfo.buildTime).toLocaleString()}</p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Environment</p>
            <p className="text-purple-900 font-mono">
              <span className={`px-2 py-1 rounded text-xs ${
                buildInfo.environment === 'production' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {buildInfo.environment}
              </span>
            </p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Vercel Environment</p>
            <p className="text-purple-900 font-mono">
              <span className={`px-2 py-1 rounded text-xs ${
                buildInfo.vercelEnv === 'production' 
                  ? 'bg-green-100 text-green-800' 
                  : buildInfo.vercelEnv === 'preview'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {buildInfo.vercelEnv}
              </span>
            </p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-purple-200">
            <p className="font-bold text-purple-700 mb-1">Node Version</p>
            <p className="text-purple-900 font-mono">{buildInfo.nodeVersion}</p>
          </div>
        </div>
      </div>
      
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
