import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { applyAppearance } from './theme.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const setUser = useCallback((next) => {
    setUserState(next);
    if (next) applyAppearance(next.settings);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const d = await api('/auth/me');
      setUser(d.user);
    } catch {
      // A failed refresh either logged the user out (401) or is a network blip; keep current state.
    }
  }, [setUser]);

  useEffect(() => {
    if (getToken()) refresh().finally(() => setLoading(false));
    window.addEventListener('nl-logout', logout);
    window.addEventListener('nl-refresh', refresh);
    return () => {
      window.removeEventListener('nl-logout', logout);
      window.removeEventListener('nl-refresh', refresh);
    };
  }, [logout, refresh]);

  const signIn = async (mode, fields) => {
    const d = await api(`/auth/${mode}`, { method: 'POST', body: fields });
    setToken(d.token);
    setUser(d.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const isTeacher = (user) => user?.role === 'teacher' || user?.role === 'admin';
