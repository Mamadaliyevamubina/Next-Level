import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { isAdmin, isStudent, isTeacher, useAuth } from '../auth.jsx';
import { effectiveTheme } from '../theme.js';
import { usePapers } from '../papers.js';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Course names for the header and footer, from the student's subject.
function courseInfo(course) {
  if (/9701/.test(course)) return { short: 'A Level · Chemistry', full: 'Cambridge International AS & A Level Chemistry 9701' };
  if (/0620|Chemistry/.test(course)) return { short: 'IGCSE · Chemistry', full: 'Cambridge IGCSE Chemistry 0620' };
  if (/0478|IGCSE/.test(course)) return { short: 'IGCSE · Computer Science', full: 'Cambridge IGCSE Computer Science 0478' };
  if (/9618|Computer Science/.test(course)) return { short: 'A Level · Computer Science', full: 'Cambridge International AS & A Level Computer Science 9618' };
  // Teachers and admins without one subject.
  return { short: 'Dombit International School', full: 'Cambridge IGCSE and AS & A Level practice' };
}

// Papers from several subjects (teachers of more than one subject, admins): a "Papers" button that opens a panel
// under the header listing every paper by subject.
function PapersPanel({ papers, onClose }) {
  const groups = [];
  for (const p of papers) {
    const name = p.subject_name || 'Papers';
    const g = groups.find((x) => x.name === name) || groups[groups.push({ name, papers: [] }) - 1];
    g.papers.push(p);
  }
  return (
    <div className="papers-panel" role="menu">
      {groups.map((g) => (
        <div key={g.name} className="papers-group">
          <span className="papers-group-title">{g.name}</span>
          {g.papers.map((p) => (
            <Link key={p.number} to={`/paper/${p.number}`} onClick={onClose} role="menuitem"><b>{p.label}</b><span>{p.title}</span></Link>
          ))}
        </div>
      ))}
    </div>
  );
}

// In the menu bar, "A Level Chemistry Paper 4" becomes "Paper 4" when every paper shown is from one subject.
function navLabel(paper, papers) {
  const oneSubject = papers.every((p) => p.subject_id === papers[0].subject_id);
  return oneSubject ? paper.label.replace(/^.*?(Paper \d+)$/, '$1') : paper.label;
}

export default function Layout({ limited = false }) {
  const { user, logout, setUser } = useAuth();
  const course = user.subject_name || '';
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const papers = usePapers();
  const [papersOpen, setPapersOpen] = useState(false);
  const papersRef = useRef(null);
  const manySubjects = papers && papers.length > 0 && !papers.every((p) => p.subject_id === papers[0].subject_id);

  useEffect(() => { setMenu(false); setPapersOpen(false); }, [location.pathname]);
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
      if (papersRef.current && !papersRef.current.contains(e.target) && !e.target.closest?.('.papers-btn')) setPapersOpen(false);
    };
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
        <Link to="/" className="topbar-logo"><Logo sub={courseInfo(course).short} /></Link>
        {!limited && (
          <nav className="topnav">
            <NavLink to="/" end>Dashboard</NavLink>
            {manySubjects ? (
              <button
                type="button"
                className={`papers-btn${papersOpen ? ' open' : ''}${papers.some((p) => location.pathname === `/paper/${p.number}`) ? ' active' : ''}`}
                aria-expanded={papersOpen}
                onClick={() => setPapersOpen(!papersOpen)}
              >
                Papers <Icon name="chevron" size={14} />
              </button>
            )
              : (papers || []).map((p) => (
                <NavLink key={p.number} to={`/paper/${p.number}`} title={`${p.label} · ${p.title}`}>{navLabel(p, papers)}</NavLink>
              ))}
            {isStudent(user) && <NavLink to="/assignments">Assignments</NavLink>}
            <NavLink to="/bookmarks">Saved</NavLink>
            <NavLink to="/courses">All courses</NavLink>
            {isTeacher(user) && <NavLink to="/teacher" end className="teacher-link">{isAdmin(user) ? 'Students' : 'My students'}</NavLink>}
            {isTeacher(user) && <NavLink to="/teacher/assignments" className="teacher-link">Assignments</NavLink>}
            {isAdmin(user) && <NavLink to="/admin" className="teacher-link">Admin</NavLink>}
          </nav>
        )}
        {manySubjects && papersOpen && <div ref={papersRef}><PapersPanel papers={papers} onClose={() => setPapersOpen(false)} /></div>}
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
                {isStudent(user) && !limited && <Link to="/assignments"><Icon name="list" /> My assignments</Link>}
                {isTeacher(user) && !limited && <Link to="/teacher"><Icon name="users" /> My students</Link>}
                {isTeacher(user) && !limited && <Link to="/teacher/assignments"><Icon name="list" /> Assignments</Link>}
                {isAdmin(user) && !limited && <Link to="/admin"><Icon name="shield" /> Admin</Link>}
                <button type="button" onClick={() => logout(true)}><Icon name="logout" /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="foot muted small">
        Next Level · Dombit International School · {courseInfo(course).full}
      </footer>
    </div>
  );
}

export function roleLabel(user) {
  if (user.role === 'super_admin') return 'Super admin';
  if (user.role === 'admin') return 'Administrator';
  if (user.role === 'teacher') return 'Teacher';
  return user.class_name ? `Student · ${user.class_name}` : 'Student';
}
