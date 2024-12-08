// context/AuthContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

type AuthContextType = {
  user: Session["user"] | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading: status === "loading",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};