import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const metadata: Metadata = {
  title: 'Elevate',
  description: 'Medical Education Portal',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F8FAFC',
};

// Helper to get the initial user on the server
async function getInitialUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // No-op for read-only server component
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Fetch profile for role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name, email')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || profile?.email || '',
        role: profile?.role,
        firstName: profile?.full_name?.split(' ')[0],
        lastName: profile?.full_name?.split(' ').slice(1).join(' '),
      };
    }
  } catch (e) {
    // Ignore errors
  }
  
  return null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getInitialUser();

  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full overflow-x-hidden antialiased">
        <ThemeProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
