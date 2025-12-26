import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { getServerUserWithProfile } from '@/lib/auth/server';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached getServerUserWithProfile - fetches user + profile once per request
  const initialUser = await getServerUserWithProfile();
  
  // Debug logging (server-side)
  console.log('[RootLayout] initialUser:', initialUser ? { 
    id: initialUser.id, 
    email: initialUser.email, 
    role: initialUser.role 
  } : null);

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
