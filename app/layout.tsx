import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MeedoProvider } from '@/lib/store';
import { PwaProvider } from '@/components/pwa/PwaProvider';

export const metadata: Metadata = {
  title: 'MEEDOSys v2.0 — Municipality of Malungon',
  description: 'Municipal Economic Enterprise Development Office Management System',
  manifest: '/manifest.json',
  applicationName: 'MEEDOSys',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MEEDOSys',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MEEDOSys" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-blue-600 selection:text-white pb-safe">
        <MeedoProvider>
          <PwaProvider>{children}</PwaProvider>
        </MeedoProvider>
      </body>
    </html>
  );
}
