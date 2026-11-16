import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'AlgoBuddy - DSA Thinking Guide & Interview Presentation Coach',
  description: 'Master algorithmic intuition, line-by-line execution tracing, and verbal interview presentation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </body>
    </html>
  );
}
