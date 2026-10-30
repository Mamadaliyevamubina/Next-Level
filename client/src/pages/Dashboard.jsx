import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Meter, { ScoreBadge } from '../components/Meter.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/papers'), api('/stats')])
      .then(([p, s]) => { setPapers(p.papers); setStats(s); })
      .catch((e) => setError(e.message));
  }, []);

  const practise = async (paper) => {
    const { id } = await api(`/papers/${paper}/next`);
    if (id) navigate(`/question/${id}`);
  };

  if (error) return <p className="error">{error}</p>;
  if (!papers || !stats) return <p className="muted">Loading…</p>;

  const t = stats.totals;
  const chapterName = (paper, ch) => papers.find((p) => p.number === paper)?.chapters.find((c) => c.number === ch)?.name;

  return (
    <>
      <h1>Hi {user.name.split(' ')[0]}</h1>
      <div className="stats">
        <div className="stat"><b>{t.answered}</b><span>of {t.questions} questions answered</span></div>
        <div className="stat"><b>{t.available ? Math.round((t.earned / t.available) * 100) : 0}%</b><span>{t.earned} / {t.available} marks on latest tries</span></div>
        <div className="stat"><b>{t.full_marks}</b><span>questions with full marks</span></div>
        <div className="stat"><b>{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</b><span>practice streak</span></div>
      </div>

      <div className="grid">
        {papers.map((p) => (
          <section key={p.number} className="card paper-card">
            <h2><Link to={`/paper/${p.number}`}>Paper {p.number}</Link></h2>
            <p className="muted small">{p.title}</p>
            <Meter earned={p.earned} available={p.available} />
            <p className="small muted">{p.attempted} / {p.questions} answered</p>
            <div className="row">
              <button type="button" className="primary" onClick={() => practise(p.number)}>Practise next</button>
              <Link to={`/paper/${p.number}`} className="button">Browse</Link>
            </div>
          </section>
        ))}
      </div>

      <div className="grid two">
        <section className="card">
          <h2>Topics to work on</h2>
          {stats.weakest.length === 0 ? (
            <p className="muted">Answer a few questions and your weakest topics will show up here.</p>
          ) : (
            <ul className="plain">
              {stats.weakest.map((w) => (
                <li key={`${w.paper}-${w.subtopic}`}>
                  <Link to={`/paper/${w.paper}?chapter=${w.chapter}&status=review`}>
                    <Meter earned={w.earned} available={w.available} label={w.subtopic} />
                  </Link>
                  <span className="muted small">Paper {w.paper} · {chapterName(w.paper, w.chapter)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Recent answers</h2>
          {stats.recent.length === 0 ? (
            <p className="muted">Nothing yet. Pick a paper above to start.</p>
          ) : (
            <ul className="plain">
              {stats.recent.map((r) => (
                <li key={r.id} className="row spread">
                  <Link to={`/question/${r.question_id}`}>{r.exam_label} · Q{r.label}</Link>
                  <ScoreBadge awarded={r.awarded} marks={r.marks} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
