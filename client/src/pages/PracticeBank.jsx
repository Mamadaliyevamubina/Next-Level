import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { usePapers } from '../papers.js';

// Teachers: the past-paper question bank, kept apart from the main page (which shows their classes).
export default function PracticeBank() {
  const papers = usePapers();
  if (!papers) return <p className="muted">Loading…</p>;

  const groups = [];
  for (const p of papers) {
    const name = p.subject_name || 'Papers';
    const g = groups.find((x) => x.name === name) || groups[groups.push({ name, papers: [] }) - 1];
    g.papers.push(p);
  }

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <h1>Practice questions</h1>
        <p className="muted">
          Every past-paper question your students practise from, with the mark scheme. Open a paper to read questions or try them yourself.
        </p>
        <div className="row">
          <Link className="btn sm" to="/bookmarks"><Icon name="star" size={16} /> Saved questions</Link>
          <Link className="btn sm" to="/courses"><Icon name="layers" size={16} /> All courses</Link>
        </div>
      </section>

      {groups.length === 0 && <p className="muted">No papers are linked to your subjects yet.</p>}
      {groups.map((g) => (
        <section key={g.name} className="card">
          <h2><Icon name="book" /> {g.name}</h2>
          <ul className="plain">
            {g.papers.map((p) => (
              <li key={p.number}>
                <Link to={`/paper/${p.number}`} className="rail-item">
                  <span className="row spread nowrap">
                    <b>{p.label} · {p.title}</b>
                    <span className="muted small">{p.questions} questions</span>
                  </span>
                  {p.description && <span className="muted small">{p.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
