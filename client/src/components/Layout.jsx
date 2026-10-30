import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { isTeacher, useAuth } from '../auth.jsx';
import { effectiveTheme } from '../theme.js';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

const PAPERS = [1, 2, 3, 4];

export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function Layout({ limited = false }) {
  const { user, logout, setUser } = useAuth();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggleTheme = async () => {
    const next = effectiveTheme(user.settings.theme) === 'dark' ? 'light' : 'dark';
    setUser({ ...user, settings: { ...user.settings, theme: next } });
    const d = await api('/account/settings', { method: 'PATCH', body: { settings: { theme: next } } });
    setUser(d.user);
  };

  const dark = effectiveTheme(user.settings.theme) === 'dark';

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="topbar-logo"><Logo /></Link>
        {!limited && (
          <nav className="topnav">
            <NavLink to="/" end>Home</NavLink>
            {PAPERS.map((p) => <NavLink key={p} to={`/paper/${p}`}>Paper {p}</NavLink>)}
            <NavLink to="/bookmarks">Saved</NavLink>
            {isTeacher(user) && <NavLink to="/teacher" className="teacher-link">My students</NavLink>}
          </nav>
        )}
        <div className="topbar-actions">
          <button type="button" className="icon-btn" onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'} aria-label="Toggle dark mode">
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <div className="menu" ref={menuRef}>
            <button type="button" className="avatar-btn" onClick={() => setMenu(!menu)} aria-expanded={menu}>
              <span className="avatar">{initials(user.name)}</span>
              <span className="avatar-name">{user.name.split(' ')[0]}</span>
            </button>
            {menu && (
              <div className="menu-panel">
                <div className="menu-head">
                  <b>{user.name}</b>
                  <span className="muted small">@{user.username} · {roleLabel(user)}</span>
                </div>
                <Link to="/account"><Icon name="settings" /> Account &amp; settings</Link>
                {isTeacher(user) && !limited && <Link to="/teacher"><Icon name="users" /> My students</Link>}
                <button type="button" onClick={logout}><Icon name="logout" /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="foot muted small">
        Next Level · Cambridge International AS &amp; A Level Computer Science 9618
      </footer>
    </div>
  );
}

export function roleLabel(user) {
  if (user.role === 'admin') return 'Administrator';
  if (user.role === 'teacher') return 'Teacher';
  return user.class_name ? `Student · ${user.class_name}` : 'Student';
}
