import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const PAPERS = [1, 2, 3, 4];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand">Next Level <small>9618</small></NavLink>
        <nav className="pills">
          <NavLink to="/" end>Home</NavLink>
          {PAPERS.map((p) => <NavLink key={p} to={`/paper/${p}`}>Paper {p}</NavLink>)}
          <NavLink to="/bookmarks">Saved</NavLink>
        </nav>
        <div className="who">
          <span className="muted">{user.name}</span>
          <button type="button" className="link" onClick={logout}>Log out</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
