import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { COURSE_INFO, sortCourses, useCatalog } from '../catalog.js';
import { applyAppearance, effectiveTheme, savedAppearance } from '../theme.js';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

// Papers grouped into the header menus: "IGCSE" (Computer Science and Chemistry) and "A Level".
function menuGroups(courses) {
  const groups = {};
  for (const c of sortCourses(courses || [])) {
    const level = COURSE_INFO[c.code]?.level || 'Courses';
    (groups[level] ||= []).push(c);
  }
  return Object.entries(groups);
}

function Dropdown({ label, courses, current }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const here = courses.some((c) => c.papers.some((p) => current === `/paper/${p.number}`));
  return (
    <div className={`site-drop${open ? ' open' : ''}${here ? ' here' : ''}`} ref={ref}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label} <Icon name="chevron" size={14} />
      </button>
      <div className="site-menu">
        {courses.map((c) => (
          <div key={c.code} className="site-menu-group">
            <span className="site-menu-title">{COURSE_INFO[c.code]?.heading || c.name}</span>
            {c.papers.map((p) => (
              <Link key={p.number} to={`/paper/${p.number}`} onClick={() => setOpen(false)}>
                <b>{p.label}</b><span>{p.title}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Light / dark switch for visitors who are not logged in (logged-in users keep it in their settings).
export function ThemeButton() {
  const [theme, setTheme] = useState(() => effectiveTheme(savedAppearance().theme));
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyAppearance({ ...savedAppearance(), theme: next });
    setTheme(next);
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Switch theme" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export function SiteHeader() {
  const { courses } = useCatalog();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [location.pathname]);
  return (
    <header className={`site-header${navOpen ? ' nav-open' : ''}`}>
      <Link to="/" className="topbar-logo"><Logo sub="Dombit International School" /></Link>
      <nav className="site-nav" aria-label="Main">
        <NavLink to="/" end>Home</NavLink>
        {menuGroups(courses).map(([level, list]) => <Dropdown key={level} label={level} courses={list} current={location.pathname} />)}
        <a href="https://school.dombit.uz" target="_blank" rel="noopener noreferrer">School website</a>
      </nav>
      <div className="topbar-actions">
        <ThemeButton />
        <Link to="/login" className="btn sm ghost site-login"><Icon name="user" size={16} /> Log in</Link>
        <Link to="/signup" className="btn sm primary">Sign up</Link>
        <button type="button" className="icon-btn site-burger" aria-label="Menu" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { courses } = useCatalog();
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <div>
          <Link to="/" className="site-footer-brand"><Logo sub="Dombit International School" /></Link>
          <p>Cambridge IGCSE Computer Science (0478) and Chemistry (0620), and AS &amp; A Level Computer Science (9618), Chemistry (9701) and Biology (9700) past-paper practice, checked against the mark scheme point by point.</p>
        </div>
        <div>
          <h4>Practice</h4>
          <ul>
            {sortCourses(courses || []).flatMap((c) => c.papers).map((p) => (
              <li key={p.number}><Link to={`/paper/${p.number}`}>{p.label.startsWith('Paper') ? `A Level ${p.label}` : p.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Dombit International School</h4>
          <ul>
            <li>81, To‘raqo‘rg‘on street, Namangan, Uzbekistan</li>
            <li><a href="tel:+998953305509">+998 95 330 55 09</a></li>
            <li><a href="https://school.dombit.uz" target="_blank" rel="noopener noreferrer">school.dombit.uz</a></li>
            <li>
              <a href="https://t.me/dombit_xalqaro_maktabi" target="_blank" rel="noopener noreferrer">Telegram</a> ·{' '}
              <a href="https://www.instagram.com/dombit_international_school/" target="_blank" rel="noopener noreferrer">Instagram</a> ·{' '}
              <a href="https://www.youtube.com/@dombit_nextlevel" target="_blank" rel="noopener noreferrer">YouTube</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="site-copy">Past-paper questions and mark schemes © Cambridge University Press &amp; Assessment, used for practice.</div>
    </footer>
  );
}

// Pages for visitors who are not logged in: home page with the site header and footer.
export default function PublicLayout() {
  return (
    <>
      <div className="shell site-shell">
        <SiteHeader />
        <main className="page"><Outlet /></main>
      </div>
      <SiteFooter />
    </>
  );
}
