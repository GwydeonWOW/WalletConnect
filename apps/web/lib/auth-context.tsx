'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  register: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    api.getMe()
      .then((res) => setState({ userId: res.data.id, isLoading: false, isAuthenticated: true }))
      .catch(() => setState({ userId: null, isLoading: false, isAuthenticated: false }));
  }, []);

  const register = useCallback(async () => {
    const { startRegistration } = await import('@simplewebauthn/browser');
    const optionsRes = await api.registerOptions();
    const credential = await startRegistration({ optionsJSON: optionsRes.data.options });
    await api.registerVerify(optionsRes.data.userId, credential);
    const me = await api.getMe();
    setState({ userId: me.data.id, isLoading: false, isAuthenticated: true });
  }, []);

  const login = useCallback(async () => {
    const { startAuthentication } = await import('@simplewebauthn/browser');
    const optionsRes = await api.loginOptions();
    const credential = await startAuthentication({ optionsJSON: optionsRes.data.options });
    await api.loginVerify(credential);
    const me = await api.getMe();
    setState({ userId: me.data.id, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setState({ userId: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
