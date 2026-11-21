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
// Students with several subjects see their level instead of one subject.
function courseInfo(course, user) {
  if (user?.subjects?.length > 1) {
    return user.level === 'igcse'
      ? { short: `IGCSE · ${user.subjects.length} subjects`, full: 'Cambridge IGCSE' }
      : { short: `A Level · ${user.subjects.length} subjects`, full: 'Cambridge International AS & A Level' };
  }
  if (/9700|Biology/.test(course)) return { short: 'A Level · Biology', full: 'Cambridge International AS & A Level Biology 9700' };
  if (/9701/.test(course)) return { short: 'A Level · Chemistry', full: 'Cambridge International AS & A Level Chemistry 9701' };
  if (/0620|Chemistry/.test(course)) return { short: 'IGCSE · Chemistry', full: 'Cambridge IGCSE Chemistry 0620' };
  if (/0478|IGCSE/.test(course)) return { short: 'IGCSE · Computer Science', full: 'Cambridge IGCSE Computer Science 0478' };
  if (/9618|Computer Science/.test(course)) return { short: 'A Level · Computer Science', full: 'Cambridge International AS & A Level Computer Science 9618' };
  // Teachers and admins without one subject.
  return { short: 'Dombit International School', full: 'Cambridge IGCSE and AS & A Level practice' };
}

// Papers grouped by subject, for the sidebar.
function groupPapers(papers) {
  const groups = [];
  for (const p of papers || []) {
    const name = p.subject_name || 'Papers';
    const g = groups.find((x) => x.name === name) || groups[groups.push({ name, papers: [] }) - 1];
    g.papers.push(p);
  }
  return groups;
}

// "A Level Chemistry Paper 4" becomes "Paper 4" inside its subject group.
const shortLabel = (paper) => paper.label.replace(/^.*?(Paper \d+)$/, '$1');

function SideLink({ to, icon, children, end }) {
  return (
    <NavLink to={to} end={end} className="side-link">
      <Icon name={icon} size={18} /><span>{children}</span>
    </NavLink>
  );
}

// Teachers' pages that belong to the question bank: the sidebar lists the papers only there.
const BANK_PATHS = /^\/(practice|paper|question|bookmarks|courses)(\/|$)/;

// Metro line colour for a subject: Computer Science blue, Chemistry green, Biology red.
const lineOf = (name = '') => (/Chem/i.test(name) ? 'chem' : /Bio/i.test(name) ? 'bio' : 'cs');
// A station's dot: open when not started, half when some questions are tried, full when every one is.
const stopState = (p) => (!p.attempted ? 'open' : p.attempted >= p.questions ? 'done' : 'part');
const stopLabel = (p) => (!p.attempted ? 'not started' : `${p.attempted} of ${p.questions} questions tried`);
// Bigger papers get bigger stations.
const stopSize = (p) => (p.questions >= 600 ? 'lg' : p.questions >= 250 ? 'md' : 'sm');

function Sidebar({ user, papers, limited, onToggleTheme, dark, logout, id, hidden, onHide }) {
  const location = useLocation();
  const inBank = BANK_PATHS.test(location.pathname);
  const groups = groupPapers(papers);
  // Subject groups start open when they hold the paper being viewed (or when there is only one subject).
  const [open, setOpen] = useState(() => Object.fromEntries(groups.map((g) => [g.name, groups.length === 1])));
  useEffect(() => {
    const current = groups.find((g) => g.papers.some((p) => location.pathname === `/paper/${p.number}`));
    if (current) setOpen((o) => ({ ...o, [current.name]: true }));
  }, [location.pathname, papers]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="sidebar" id={id} aria-label="Main navigation" inert={hidden || undefined}>
      <div className="sidebar-top">
        <Link to="/" className="sidebar-logo"><Logo sub={courseInfo(user.subject_name || '', user).short} /></Link>
        <button type="button" className="icon-btn menu-hide" onClick={onHide} title="Hide the menu ( [ )" aria-label="Hide the menu" aria-controls={id} aria-expanded="true">
          <Icon name="chevron" size={18} />
        </button>
      </div>

      {!limited && (
        <nav className="side-nav">
          {isStudent(user) && (
            <div className="side-section">
              <span className="side-title">Practice</span>
              <SideLink to="/" icon="home" end>Dashboard</SideLink>
              <SideLink to="/assignments" icon="list">My assignments</SideLink>
              <SideLink to="/bookmarks" icon="star">Saved questions</SideLink>
              <SideLink to="/courses" icon="layers">All courses</SideLink>
            </div>
          )}

          {isTeacher(user) && (
            <div className="side-section">
              <span className="side-title">Teaching</span>
              <SideLink to="/" icon="home" end>My classes</SideLink>
              <SideLink to="/teacher" icon="users" end>{isAdmin(user) ? 'Students' : 'My students'}</SideLink>
              <SideLink to="/teacher/assignments" icon="list">Assignments</SideLink>
              {isAdmin(user) && <SideLink to="/admin" icon="shield">Admin</SideLink>}
            </div>
          )}

          {isTeacher(user) && (
            <div className="side-section">
              <span className="side-title">Question bank</span>
              <SideLink to="/practice" icon="layers">Practice questions</SideLink>
            </div>
          )}

          {groups.length > 0 && (isStudent(user) || inBank) && (
            <div className="side-section">
              <span className="side-title">Papers</span>
              {groups.map((g) => (
                <div key={g.name} className={`side-group line-${lineOf(g.name)}`}>
                  {groups.length > 1 && (
                    <button type="button" className={`side-group-btn${open[g.name] ? ' open' : ''}`} aria-expanded={!!open[g.name]}
                      onClick={() => setOpen({ ...open, [g.name]: !open[g.name] })}>
                      <span className="line-chip" aria-hidden="true" /><span>{g.name}</span><Icon name="chevron" size={14} />
                    </button>
                  )}
                  {(groups.length === 1 || open[g.name]) && (
                    <div className="side-line">
                      {g.papers.map((p) => (
                        <NavLink key={p.number} to={`/paper/${p.number}`} className="side-link station" title={`${p.label} · ${p.title}`}>
                          <span className={`stop ${stopState(p)} ${stopSize(p)}`} aria-hidden="true" />
                          <span><b>{shortLabel(p)}</b><small>{p.title}</small></span>
                          <span className="visually-hidden">, {stopLabel(p)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </nav>
      )}

      <div className="side-foot">
        <SideLink to="/account" icon="settings">Account &amp; settings</SideLink>
        <button type="button" className="side-link" onClick={onToggleTheme}>
          <Icon name={dark ? 'sun' : 'moon'} size={18} /><span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div className="side-user">
          <span className="avatar sm">{initials(user.name)}</span>
          <span className="side-user-text"><b>{user.name}</b><small>@{user.username} · {roleLabel(user)}</small></span>
          <button type="button" className="icon-btn" onClick={() => logout(true)} title="Log out" aria-label="Log out"><Icon name="logout" size={18} /></button>
        </div>
      </div>
    </aside>
  );
}

export default function Layout({ limited = false }) {
  const { user, logout, setUser } = useAuth();
  const location = useLocation();
  const papers = usePapers();
  const [drawer, setDrawer] = useState(false); // sidebar on small screens
  // Below 900px the sidebar is a drawer: closed, it is out of the Tab order and hidden from screen readers.
  const narrowQuery = '(max-width: 900px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(narrowQuery).matches);
  const menuBtn = useRef(null);
  // Wide screens: the menu can be hidden to give the work the whole width ([ key). Remembered in this browser.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('nl-app-menu') === 'hidden');
  useEffect(() => { localStorage.setItem('nl-app-menu', collapsed ? 'hidden' : 'shown'); }, [collapsed]);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.key !== '[' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      setCollapsed((c) => !c);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(narrowQuery);
    const onChange = () => { setNarrow(mq.matches); if (!mq.matches) setDrawer(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  useEffect(() => { setDrawer(false); }, [location.pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    // Open: move focus into the menu, stop the page behind it scrolling, close on Escape and return focus.
    document.querySelector('#app-sidebar .side-link')?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      menuBtn.current?.focus({ preventScroll: true });
    };
  }, [drawer]);

  const toggleTheme = async () => {
    const next = effectiveTheme(user.settings.theme) === 'dark' ? 'light' : 'dark';
    setUser({ ...user, settings: { ...user.settings, theme: next } });
    const d = await api('/account/settings', { method: 'PATCH', body: { settings: { theme: next } } });
    setUser(d.user);
  };

  const dark = effectiveTheme(user.settings.theme) === 'dark';

  return (
    <div className={`app${drawer ? ' drawer-open' : ''}${collapsed && !narrow ? ' menu-hidden' : ''}`}>
      <Sidebar user={user} papers={papers} limited={limited} onToggleTheme={toggleTheme} dark={dark} logout={logout}
        id="app-sidebar" hidden={(narrow && !drawer) || (!narrow && collapsed)} onHide={() => setCollapsed(true)} />
      <button type="button" className="drawer-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setDrawer(false)} />
      <div className="app-main">
        <header className="mobilebar">
          <button type="button" className="icon-btn" ref={menuBtn} onClick={() => setDrawer(true)}
            aria-label="Open menu" aria-expanded={drawer} aria-controls="app-sidebar"><Icon name="menu" /></button>
          <Link to="/" className="topbar-logo"><Logo sub={courseInfo(user.subject_name || '', user).short} /></Link>
        </header>
        {collapsed && !narrow && (
          <button type="button" className="menu-show" onClick={() => setCollapsed(false)} title="Show the menu ( [ )" aria-controls="app-sidebar" aria-expanded="false">
            <Icon name="menu" size={18} /> Menu
          </button>
        )}
        <main className="page">
          <Outlet />
        </main>
        <footer className="foot muted small">
          Next Level · Dombit International School · {courseInfo(user.subject_name || '', user).full}
        </footer>
      </div>
    </div>
  );
}

export function roleLabel(user) {
  if (user.role === 'super_admin') return 'Super admin';
  if (user.role === 'admin') return 'Administrator';
  if (user.role === 'teacher') return 'Teacher';
  return user.class_name ? `Student · ${user.class_name}` : 'Student';
}
