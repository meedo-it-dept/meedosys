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
      { url: '/favicon_LGUMalungon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_LGUMalungon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_LGUMalungon/LGU_LOGO1.png', type: 'image/png' },
      { url: '/favicon_LGUMalungon/favicon.ico' },
    ],
    apple: [
      { url: '/favicon_LGUMalungon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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
        <link rel="icon" type="image/png" href="/favicon_LGUMalungon/LGU_LOGO1.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MEEDOSys" />
        <link rel="apple-touch-icon" href="/favicon_LGUMalungon/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white pb-safe">
        <MeedoProvider>
          <PwaProvider>{children}</PwaProvider>
        </MeedoProvider>
      </body>
    </html>
  );
}
