import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

function SideLink({ to, icon, children, end, badge, badgeTone = '' }) {
  return (
    <NavLink to={to} end={end} className="side-link" title={typeof children === 'string' ? children : undefined}>
      <Icon name={icon} size={18} /><span className="side-label">{children}</span>
      {badge !== undefined && badge !== null && <span className={`side-badge ${badgeTone}`}>{badge}</span>}
    </NavLink>
  );
}

// Teachers' pages that belong to the question bank: the sidebar lists the papers only there.
const BANK_PATHS = /^\/(practice|paper|question|bookmarks|courses)(\/|$)/;

// Metro line colour for a subject: Computer Science blue, Chemistry green, Biology red, Maths amber.
const lineOf = (name = '') => (/Chem/i.test(name) ? 'chem' : /Bio/i.test(name) ? 'bio' : /Math/i.test(name) ? 'math' : 'cs');
// A station's dot: open when not started, half when some questions are tried, full when every one is.
const stopState = (p) => (!p.attempted ? 'open' : p.attempted >= p.questions ? 'done' : 'part');
const stopLabel = (p) => (!p.attempted ? 'not started' : `${p.attempted} of ${p.questions} questions tried`);
// Bigger papers get bigger stations.
const stopSize = (p) => (p.questions >= 600 ? 'lg' : p.questions >= 250 ? 'md' : 'sm');

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// The pages in the main menu, also searched by "Find".
function menuPages(user) {
  const pages = [];
  if (isStudent(user)) {
    pages.push(
      { to: '/', icon: 'home', label: 'Dashboard', end: true, section: 'Practice' },
      { to: '/assignments', icon: 'list', label: 'My assignments', section: 'Practice', badge: 'assignments' },
      { to: '/competition', icon: 'target', label: 'Competition', section: 'Practice', badge: 'place' },
      { to: '/bookmarks', icon: 'star', label: 'Saved questions', section: 'Practice' },
      { to: '/courses', icon: 'layers', label: 'All courses', section: 'Practice' },
    );
  }
  if (isTeacher(user)) {
    pages.push(
      { to: '/', icon: 'home', label: 'My classes', end: true, section: 'Teaching' },
      { to: '/teacher', icon: 'users', label: isAdmin(user) ? 'Students' : 'My students', end: true, section: 'Teaching' },
      { to: '/teacher/assignments', icon: 'list', label: 'Assignments and mock exams', section: 'Teaching' },
      { to: '/teacher/feedback', icon: 'eye', label: 'AI feedback', section: 'Teaching', badge: 'feedback' },
      { to: '/competition', icon: 'target', label: 'Competition', section: 'Teaching' },
    );
    if (isAdmin(user)) pages.push({ to: '/admin', icon: 'shield', label: 'Admin', section: 'Teaching' });
    pages.push({ to: '/practice', icon: 'layers', label: 'Practice questions', section: 'Question bank' });
  }
  pages.push({ to: '/account', icon: 'settings', label: 'Account & settings', section: '' });
  return pages;
}

// "Find": pages, papers and chapters whose name contains every word typed.
function searchMenu(q, pages, papers) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hit = (text) => words.every((w) => text.toLowerCase().includes(w));
  const out = [];
  for (const p of pages) if (hit(p.label)) out.push({ key: `page${p.to}`, to: p.to, icon: p.icon, title: p.label, sub: 'Page' });
  for (const p of papers || []) {
    const name = `${p.subject_name || ''} ${p.label} ${p.title}`;
    if (hit(name)) out.push({ key: `paper${p.number}`, to: `/paper/${p.number}`, icon: 'book', title: `${p.label} · ${p.title}`, sub: p.subject_name || 'Paper' });
    for (const c of p.chapters || []) {
      if (hit(`${c.name} ${p.label} ${p.subject_name || ''}`)) {
        out.push({ key: `ch${p.number}-${c.number}`, to: `/paper/${p.number}?chapter=${c.number}`, icon: 'layers', title: c.name, sub: `${p.label} · chapter ${c.number}` });
      }
    }
  }
  return out.slice(0, 12);
}

function QuickFind({ pages, papers, inputRef }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const results = searchMenu(q, pages, papers);
  useEffect(() => setSel(0), [q]);
  const go = (r) => { if (!r) return; navigate(r.to); setQ(''); inputRef.current?.blur(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[sel]); }
    else if (e.key === 'Escape') { if (q) { e.stopPropagation(); setQ(''); } else inputRef.current?.blur(); }
  };
  return (
    <div className="quick-find">
      <label className="quick-find-box">
        <Icon name="search" size={16} />
        <span className="visually-hidden">Find a page, paper or chapter</span>
        <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Find a paper or chapter" autoComplete="off" role="combobox" aria-expanded={results.length > 0}
          aria-controls="quick-find-list" aria-activedescendant={results[sel] ? `qf-${results[sel].key}` : undefined} />
        <kbd aria-hidden="true">/</kbd>
      </label>
      {q.trim() && (
        <ul className="quick-find-list plain" id="quick-find-list" role="listbox" aria-label="Results">
          {results.length === 0 && <li className="muted small qf-none">Nothing matches “{q.trim()}”.</li>}
          {results.map((r, i) => (
            <li key={r.key} id={`qf-${r.key}`} role="option" aria-selected={i === sel}
              className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onMouseDown={(e) => { e.preventDefault(); go(r); }}>
              <Icon name={r.icon} size={16} />
              <span><b>{r.title}</b><small>{r.sub}</small></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Sidebar({ user, papers, limited, onToggleTheme, dark, logout, id, hidden, mode, setMode, findRef, badges }) {
  const location = useLocation();
  const inBank = BANK_PATHS.test(location.pathname);
  const groups = groupPapers(papers);
  const pages = menuPages(user);
  const rail = mode === 'rail';
  const current = Number((location.pathname.match(/^\/paper\/(\d+)/) || [])[1]) || null;
  const chapterNow = new URLSearchParams(location.search).get('chapter');
  // Subject groups start open when they hold the paper being viewed (or when there is only one subject).
  const [open, setOpen] = useState(() => Object.fromEntries(groups.map((g) => [g.name, groups.length === 1])));
  // Papers whose chapters are listed under them; the paper being viewed opens by itself.
  const [expanded, setExpanded] = useState({});
  useEffect(() => {
    const g = groups.find((x) => x.papers.some((p) => p.number === current));
    if (g) setOpen((o) => ({ ...o, [g.name]: true }));
    if (current) setExpanded((e) => ({ ...e, [current]: true }));
  }, [current, papers]); // eslint-disable-line react-hooks/exhaustive-deps

  const badgeFor = (p) => {
    if (p.badge === 'assignments' && badges.assignments) return { badge: badges.assignments, tone: 'warn' };
    if (p.badge === 'feedback' && badges.feedback) return { badge: badges.feedback, tone: 'warn' };
    if (p.badge === 'place' && badges.place) return { badge: ordinal(badges.place), tone: badges.place === 1 ? 'gold' : '' };
    return {};
  };
  const sections = [...new Set(pages.filter((p) => p.section).map((p) => p.section))];

  return (
    <aside className={`sidebar${rail ? ' rail' : ''}`} id={id} aria-label="Main navigation" inert={hidden || undefined}>
      <div className="sidebar-top">
        <Link to="/" className="sidebar-logo" title="Next Level"><Logo sub={courseInfo(user.subject_name || '', user).short} /></Link>
        <div className="sidebar-controls">
          <button type="button" className="icon-btn menu-narrow" onClick={() => setMode(rail ? 'full' : 'rail')}
            title={rail ? 'Show the full menu ( [ )' : 'Make the menu narrow ( [ )'} aria-label={rail ? 'Show the full menu' : 'Make the menu narrow'}>
            <Icon name="chevron" size={18} />
          </button>
          <button type="button" className="icon-btn menu-hide" onClick={() => setMode('hidden')} title="Hide the menu ( \\ )" aria-label="Hide the menu" aria-controls={id} aria-expanded="true">
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      {!limited && (rail
        ? <button type="button" className="side-link rail-find" title="Find a paper or chapter ( / )" onClick={() => { setMode('full'); setTimeout(() => findRef.current?.focus(), 0); }}><Icon name="search" size={18} /><span className="side-label">Find</span></button>
        : <QuickFind pages={pages} papers={papers} inputRef={findRef} />)}

      {!limited && (
        <nav className="side-nav">
          {sections.map((sec) => (
            <div className="side-section" key={sec}>
              <span className="side-title">{sec}</span>
              {pages.filter((p) => p.section === sec).map((p) => {
                const b = badgeFor(p);
                return <SideLink key={p.to + p.label} to={p.to} icon={p.icon} end={p.end} badge={b.badge} badgeTone={b.tone}>{p.label}</SideLink>;
              })}
            </div>
          ))}

          {groups.length > 0 && (isStudent(user) || inBank) && (
            <div className="side-section">
              <span className="side-title">Papers</span>
              {groups.map((g) => (
                <div key={g.name} className={`side-group line-${lineOf(g.name)}`}>
                  {groups.length > 1 && !rail && (
                    <button type="button" className={`side-group-btn${open[g.name] ? ' open' : ''}`} aria-expanded={!!open[g.name]}
                      onClick={() => setOpen({ ...open, [g.name]: !open[g.name] })}>
                      <span className="line-chip" aria-hidden="true" /><span>{g.name}</span><Icon name="chevron" size={14} />
                    </button>
                  )}
                  {(groups.length === 1 || open[g.name] || rail) && (
                    <div className="side-line">
                      {g.papers.map((p) => {
                        const show = expanded[p.number] && !rail && p.chapters?.length > 0;
                        return (
                          <div key={p.number} className="station-wrap">
                            <div className="station-row">
                              <NavLink to={`/paper/${p.number}`} end className={() => `side-link station${p.number === current ? ' active' : ''}`} title={`${p.label} · ${p.title} · ${stopLabel(p)}`}>
                                <span className={`stop ${stopState(p)} ${stopSize(p)}`} aria-hidden="true" />
                                <span className="side-label"><b>{shortLabel(p)}</b><small>{p.title}</small></span>
                                <span className="visually-hidden">, {stopLabel(p)}</span>
                              </NavLink>
                              {!rail && p.chapters?.length > 0 && (
                                <button type="button" className={`icon-btn chap-toggle${show ? ' open' : ''}`} aria-expanded={!!show}
                                  aria-label={`${show ? 'Hide' : 'Show'} the chapters of ${p.label}`} title={show ? 'Hide chapters' : 'Show chapters'}
                                  onClick={() => setExpanded({ ...expanded, [p.number]: !show })}>
                                  <Icon name="chevron" size={14} />
                                </button>
                              )}
                            </div>
                            {show && (
                              <ul className="side-chapters plain">
                                {p.chapters.map((c) => {
                                  const on = p.number === current && chapterNow === String(c.number);
                                  const pctTried = c.questions ? Math.round((c.attempted / c.questions) * 100) : 0;
                                  return (
                                    <li key={c.number}>
                                      <Link to={`/paper/${p.number}?chapter=${c.number}`} className={`side-chapter${on ? ' active' : ''}`} aria-current={on ? 'page' : undefined}
                                        title={`${c.name}: ${c.attempted} of ${c.questions} tried`}>
                                        <span className="side-chapter-name">{c.name}</span>
                                        <span className="side-chapter-pct" style={{ '--p': `${pctTried}%` }} aria-label={`${pctTried}% tried`}>{pctTried > 0 ? `${pctTried}%` : ''}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>
      )}

      <div className="side-foot">
        {pages.filter((p) => !p.section).map((p) => <SideLink key={p.to} to={p.to} icon={p.icon}>{p.label}</SideLink>)}
        <button type="button" className="side-link" onClick={onToggleTheme} title={dark ? 'Light mode' : 'Dark mode'}>
          <Icon name={dark ? 'sun' : 'moon'} size={18} /><span className="side-label">{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div className="side-user">
          <span className="avatar sm" title={user.name}>{initials(user.name)}</span>
          <span className="side-user-text side-label"><b>{user.name}</b><small>@{user.username} · {roleLabel(user)}</small></span>
          <button type="button" className="icon-btn" onClick={() => logout(true)} title="Log out" aria-label="Log out"><Icon name="logout" size={18} /></button>
        </div>
      </div>
    </aside>
  );
}

// Menu on wide screens: 'full', 'rail' (icons only) or 'hidden'. Remembered in this browser.
const MENU_KEY = 'nl-app-menu';
const readMenu = () => {
  const v = localStorage.getItem(MENU_KEY);
  return v === 'hidden' || v === 'rail' ? v : 'full';
};
const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

// Numbers on the menu: open assignments and the student's place in this week's competition,
// or for teachers the AI feedback they have not read yet.
function useBadges(user, pathname) {
  const [badges, setBadges] = useState({});
  const lastBoard = useRef(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const again = () => setTick((t) => t + 1);
    window.addEventListener('nl-feedback', again);
    return () => window.removeEventListener('nl-feedback', again);
  }, []);
  useEffect(() => {
    if (!isTeacher(user) || user.status !== 'approved') return undefined;
    let live = true;
    api('/teacher/feedback?unseen=1&limit=1')
      .then((d) => live && setBadges((b) => ({ ...b, feedback: d.unseen || null })))
      .catch(() => {});
    return () => { live = false; };
  }, [user, pathname, tick]);
  useEffect(() => {
    if (!isStudent(user) || user.status !== 'approved') return;
    let live = true;
    api('/assignments')
      .then((d) => live && setBadges((b) => ({ ...b, assignments: d.assignments.filter((a) => !a.submitted_at).length || null })))
      .catch(() => {});
    if (Date.now() - lastBoard.current > 60000) {
      lastBoard.current = Date.now();
      api('/leaderboard?period=week')
        .then((d) => live && setBadges((b) => ({ ...b, place: d.me && d.me.solved > 0 ? d.me.place : null })))
        .catch(() => {});
    }
    return () => { live = false; };
  }, [user, pathname]);
  return badges;
}

export default function Layout({ limited = false }) {
  const { user, logout, setUser } = useAuth();
  const location = useLocation();
  const papers = usePapers();
  const badges = useBadges(user, location.pathname);
  const [drawer, setDrawer] = useState(false); // sidebar on small screens
  // Below 900px the sidebar is a drawer: closed, it is out of the Tab order and hidden from screen readers.
  const narrowQuery = '(max-width: 900px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(narrowQuery).matches);
  const menuBtn = useRef(null);
  const findRef = useRef(null);
  // Wide screens: the menu can be full, narrow (icons only) or hidden, whenever the student wants.
  const [mode, setMode] = useState(readMenu);
  useEffect(() => { localStorage.setItem(MENU_KEY, mode); }, [mode]);
  useEffect(() => {
    // [ narrow ↔ full · \ hide ↔ show · / or Ctrl+K find.
    const onKey = (e) => {
      if (typing(e.target)) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        if (window.matchMedia(narrowQuery).matches) setDrawer(true); else setMode('full');
        setTimeout(() => findRef.current?.focus(), 0);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '[') { e.preventDefault(); setMode((m) => (m === 'full' ? 'rail' : 'full')); }
      else if (e.key === '\\') { e.preventDefault(); setMode((m) => (m === 'hidden' ? 'full' : 'hidden')); }
      else if (e.key === '/') {
        e.preventDefault();
        if (window.matchMedia(narrowQuery).matches) setDrawer(true); else setMode('full');
        setTimeout(() => findRef.current?.focus(), 0);
      }
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
  useEffect(() => { setDrawer(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!drawer) return undefined;
    // Open: move focus into the menu, stop the page behind it scrolling, close on Escape and return focus.
    if (document.activeElement !== findRef.current) document.querySelector('#app-sidebar .side-link')?.focus();
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
  const wideMode = narrow ? 'full' : mode;

  return (
    <div className={`app${drawer ? ' drawer-open' : ''}${wideMode === 'hidden' ? ' menu-hidden' : ''}${wideMode === 'rail' ? ' menu-rail' : ''}`}>
      <Sidebar user={user} papers={papers} limited={limited} onToggleTheme={toggleTheme} dark={dark} logout={logout}
        id="app-sidebar" hidden={(narrow && !drawer) || wideMode === 'hidden'} mode={wideMode} setMode={setMode} findRef={findRef} badges={badges} />
      <button type="button" className="drawer-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setDrawer(false)} />
      <div className="app-main">
        <header className="mobilebar">
          <button type="button" className="icon-btn" ref={menuBtn} onClick={() => setDrawer(true)}
            aria-label="Open menu" aria-expanded={drawer} aria-controls="app-sidebar"><Icon name="menu" /></button>
          <Link to="/" className="topbar-logo"><Logo sub={courseInfo(user.subject_name || '', user).short} /></Link>
        </header>
        {wideMode === 'hidden' && (
          <button type="button" className="menu-show" onClick={() => setMode('full')} title="Show the menu ( \\ )" aria-controls="app-sidebar" aria-expanded="false">
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
