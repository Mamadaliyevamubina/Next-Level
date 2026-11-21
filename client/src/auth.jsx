import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { applyAppearance } from './theme.js';
import { clearPapers } from './papers.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  // True after the user pressed "Log out" (not when a session expires), so they land on the home page.
  const [signedOut, setSignedOut] = useState(false);
  const userRef = useRef(null);
  userRef.current = user;

  const setUser = useCallback((next) => {
    setUserState(next);
    if (next) applyAppearance(next.settings);
  }, []);

  const logout = useCallback((manual = false) => {
    setSignedOut(manual === true);
    clearPapers();
    setToken(null);
    setUserState(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const d = await api('/auth/me');
      // Different subjects or a new approval status mean a different list of papers.
      const subjectsKey = (u) => (u?.subjects || []).map((s) => s.subject_id).join(',');
      if (subjectsKey(d.user) !== subjectsKey(userRef.current) || d.user.status !== userRef.current?.status) clearPapers();
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
    clearPapers();
    setSignedOut(false);
    setToken(d.token);
    setUser(d.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signedOut, signIn, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Roles: student, teacher, admin, super_admin. Admins and super admins can also do everything a teacher can.
export const isAdmin = (user) => user?.role === 'admin' || user?.role === 'super_admin';
export const isTeacher = (user) => user?.role === 'teacher' || isAdmin(user);
export const isStudent = (user) => user?.role === 'student';
