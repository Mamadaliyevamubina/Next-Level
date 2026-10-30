import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (getToken()) {
      api('/auth/me')
        .then((d) => setUser(d.user))
        .catch(logout)
        .finally(() => setLoading(false));
    }
    window.addEventListener('nl-logout', logout);
    return () => window.removeEventListener('nl-logout', logout);
  }, [logout]);

  const signIn = async (mode, fields) => {
    const d = await api(`/auth/${mode}`, { method: 'POST', body: fields });
    setToken(d.token);
    setUser(d.user);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
