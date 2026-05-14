'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  register: (email: string) => Promise<string | null>;
  verifyRegistration: (email: string, code: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  verifyLogin: (email: string, code: string) => Promise<void>;
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

  const register = useCallback(async (email: string) => {
    const res = await api.registerStart(email);
    return res.data.qrUrl;
  }, []);

  const verifyRegistration = useCallback(async (email: string, code: string) => {
    await api.registerVerify(email, code);
    const me = await api.getMe();
    setState({ userId: me.data.id, isLoading: false, isAuthenticated: true });
  }, []);

  const login = useCallback(async (email: string) => {
    await api.loginStart(email);
  }, []);

  const verifyLogin = useCallback(async (email: string, code: string) => {
    await api.loginVerify(email, code);
    const me = await api.getMe();
    setState({ userId: me.data.id, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setState({ userId: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, verifyRegistration, login, verifyLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
