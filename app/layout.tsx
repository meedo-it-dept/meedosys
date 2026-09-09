import type { Metadata } from 'next';
import './globals.css';
import { MeedoProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'MEEDOSys v2.0 — Municipality of Malungon',
  description: 'Municipal Economic Enterprise Development Office Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <MeedoProvider>{children}</MeedoProvider>
      </body>
    </html>
  );
}
