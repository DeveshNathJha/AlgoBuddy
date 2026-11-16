'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { THEME_STORAGE_KEY } from '@/lib/config';

export type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function Providers({ children }: { children: React.ReactNode }) {
  // The inline script in layout.tsx sets data-theme before paint; read it back here.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage blocked */
    }
    setTheme(next);
  }, []);

  const content = (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {/* Bottom-right so notifications never cover the navbar buttons. */}
      <Toaster position="bottom-right" theme={theme} closeButton richColors={false} duration={3500} visibleToasts={3} />
    </ThemeContext.Provider>
  );

  return GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider> : content;
}
