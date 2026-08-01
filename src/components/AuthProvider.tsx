'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  accounts: Account[];
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('banking_token');
      if (!storedToken) { setLoading(false); return; }

      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAccounts(data.accounts || []);
        setToken(storedToken);
      } else {
        localStorage.removeItem('banking_token');
        setUser(null); setAccounts([]); setToken(null);
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string, isAdmin?: boolean) => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, isAdmin }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('banking_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshUser();
  };

  const register = async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    localStorage.setItem('banking_token', result.token);
    setToken(result.token);
    setUser(result.user);
    await refreshUser();
  };

  const logout = () => { localStorage.removeItem('banking_token'); setUser(null); setAccounts([]); setToken(null); };

  return (
    <AuthContext.Provider value={{ user, accounts, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
