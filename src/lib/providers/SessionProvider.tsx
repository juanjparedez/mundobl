'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Cada foco de pestana pedia /api/auth/session: una funcion mas por visita.
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  );
}
