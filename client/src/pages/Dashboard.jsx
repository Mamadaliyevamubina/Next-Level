import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { isTeacher, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Meter, { ScoreBadge } from '../components/Meter.jsx';
import { Stat } from './Teacher.jsx';

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

  const s = user.settings;
  const t = stats.totals;
  const goal = s.dailyGoal;
  const goalPct = Math.min(100, Math.round((t.today / goal) * 100));
  const main = papers.find((p) => p.number === s.defaultPaper);
  const ordered = main ? [main, ...papers.filter((p) => p !== main)] : papers;
  const chapterName = (paper, ch) => papers.find((p) => p.number === paper)?.chapters.find((c) => c.number === ch)?.name;
  const maxDay = Math.max(1, ...stats.activity.map((d) => d.attempts));

  return (
    <div className="stack-lg">
      <section className="card hero-card dash-hero">
        <div className="grow">
          <p className="eyebrow">{user.class_name ? `Class ${user.class_name}` : 'A Level Computer Science'}{user.teacher_name ? ` · ${user.teacher_name}` : ''}</p>
          <h1>Hi {user.name.split(' ')[0]}, ready to level up?</h1>
          <p className="muted">
            {t.today >= goal ? `Daily goal done: ${t.today} questions today. Great work.` : `${t.today} of ${goal} questions done today.`}
          </p>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => practise(main?.number || 1)}>
              Practise {main ? `Paper ${main.number}` : 'now'} <Icon name="arrow" />
            </button>
            {isTeacher(user) && <Link to="/teacher" className="btn"><Icon name="users" /> My students</Link>}
          </div>
        </div>
        <div className="goal-ring" style={{ '--p': goalPct }} title={`${t.today} / ${goal} today`}>
          <span><b>{t.today}</b>/{goal}<small>today</small></span>
        </div>
      </section>

      <div className="stats">
        <Stat icon="book" value={t.answered} label={`of ${t.questions} questions answered`} />
        <Stat icon="chart" value={`${t.available ? Math.round((t.earned / t.available) * 100) : 0}%`} label={`${t.earned} / ${t.available} marks on latest tries`} />
        <Stat icon="check" value={t.full_marks} label="questions with full marks" />
        {s.showStreak && <Stat icon="flame" value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`} label="practice streak" />}
      </div>

      <div className="grid">
        {ordered.map((p) => (
          <section key={p.number} className={`card paper-card ${p === main ? 'main' : ''}`}>
            <p className="eyebrow">{p === main ? 'Your main paper' : `Paper ${p.number}`}</p>
            <h2><Link to={`/paper/${p.number}`}>Paper {p.number}</Link></h2>
            <p className="muted small">{p.title}</p>
            <Meter earned={p.earned} available={p.available} />
            <p className="small muted">{p.attempted} / {p.questions} answered</p>
            <div className="row">
              <button type="button" className="btn primary sm" onClick={() => practise(p.number)}>Practise next</button>
              <Link to={`/paper/${p.number}`} className="btn sm">Browse</Link>
            </div>
          </section>
        ))}
      </div>

      <div className="grid three">
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
        <section className="card">
          <h2>Last 2 weeks</h2>
          <div className="bars short" role="img" aria-label="Questions answered per day over the last 14 days">
            {stats.activity.map((d) => (
              <span key={d.day} className="bar" title={`${d.day}: ${d.attempts}`}>
                <span style={{ height: `${(d.attempts / maxDay) * 100}%` }} />
              </span>
            ))}
          </div>
          <p className="muted small">{stats.activity.reduce((n, d) => n + d.attempts, 0)} tries in 14 days</p>
        </section>
      </div>
    </div>
  );
}
