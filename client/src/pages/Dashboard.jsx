import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { isTeacher, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Meter, { ScoreBadge } from '../components/Meter.jsx';
import { Stat } from './Teacher.jsx';


const lineOf = (name = '') => (/Chem/i.test(name) ? 'chem' : /Bio/i.test(name) ? 'bio' : 'cs');
// "A Level Chemistry Paper 4" → "P4", "IGCSE Paper 1" → "P1": the plate's short code.
const shortCode = (p) => `P${(p.label.match(/(\d+)$/) || [])[1] || p.number}`;

// Share of marks earned per week for the last 8 weeks, as columns, with the change since the first week
// that had answers.
function Trend({ weeks }) {
  const pct = (w) => (w.available ? Math.round((w.earned / w.available) * 100) : null);
  const active = weeks.filter((w) => w.attempts > 0);
  if (active.length === 0) return <p className="muted">Answer some questions and your weekly score shows up here.</p>;
  const first = pct(active[0]);
  const last = pct(active[active.length - 1]);
  const diff = last - first;
  const label = (w) => new Date(`${w.week}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return (
    <>
      <p className="trend-lead">
        <b>{last}%</b> of marks this {active[active.length - 1] === weeks[weeks.length - 1] ? 'week' : 'last active week'}
        {active.length > 1 && (
          <span className={`trend-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
            {diff > 0 ? `up ${diff} points` : diff < 0 ? `down ${-diff} points` : 'no change'} since {label(active[0])}
          </span>
        )}
      </p>
      <div className="trend" role="img" aria-label={`Share of marks per week: ${weeks.map((w) => `${label(w)} ${pct(w) ?? 'no answers'}${pct(w) === null ? '' : '%'}`).join(', ')}`}>
        {weeks.map((w) => (
          <div key={w.week} className="trend-col" title={`Week of ${label(w)}: ${w.attempts} answers${w.available ? `, ${pct(w)}% of marks` : ''}`}>
            <span className="trend-pct">{pct(w) === null ? '' : `${pct(w)}%`}</span>
            <span className="trend-bar"><span style={{ height: `${pct(w) ?? 0}%` }} className={pct(w) === null ? 'empty' : pct(w) >= 70 ? 'ok' : pct(w) >= 40 ? 'warn' : 'bad'} /></span>
            <span className="trend-week">{label(w)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

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
          <p className="eyebrow">{user.class_name ? `Class ${user.class_name}` : (user.subject_name || 'Your practice')}{user.teacher_name ? ` · ${user.teacher_name}` : ''}</p>
          <h1>Hi {user.name.split(' ')[0]}, ready to level up?</h1>
          <p className="muted">
            {t.today >= goal ? `Daily goal done: ${t.today} questions today. Great work.` : `${t.today} of ${goal} questions done today.`}
          </p>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => practise(main?.number || papers[0].number)}>
              Practise {main ? main.label : 'now'} <Icon name="arrow" />
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

      <section className="card progress-card" aria-labelledby="progress-h">
        <div className="row spread">
          <h2 id="progress-h">Your progress</h2>
          <span className="muted small">Each stop is a chapter: open = not started, half = started, full = every question tried</span>
        </div>
        <ul className="plain progress-lines">
          {ordered.map((p) => (
            <li key={p.number} className={`progress-line line-${lineOf(p.subject_name)}`}>
              <div className="progress-head">
                <Link to={`/paper/${p.number}`} className="plate"><span className="plate-code">{shortCode(p)}</span><span>{p.label}</span></Link>
                <span className="progress-nums">
                  <b>{p.attempted}</b> of {p.questions} questions done
                  <span className="sep" aria-hidden="true">·</span>
                  <b>{p.available ? `${Math.round((p.earned / p.available) * 100)}%` : '—'}</b> of marks
                </span>
                <button type="button" className="btn sm primary" onClick={() => practise(p.number)}>Practise next</button>
              </div>
              <div className="stops" role="list" aria-label={`${p.label} chapters`}>
                {p.chapters.map((c) => (
                  <Link
                    role="listitem"
                    key={c.number}
                    to={`/paper/${p.number}?chapter=${c.number}`}
                    className="chapter-dot"
                    title={`${c.number}. ${c.name}: ${c.attempted} of ${c.questions} tried${c.available ? `, ${Math.round((c.earned / c.available) * 100)}% of marks` : ''}`}
                  >
                    <span className={`stop sm ${!c.attempted ? 'open' : c.attempted >= c.questions ? 'done' : 'part'}`} aria-hidden="true" />
                    <span className="visually-hidden">{c.number}. {c.name}: {c.attempted} of {c.questions} tried</span>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>How you are going</h2>
          <Trend weeks={stats.weekly} />
        </section>
        <section className="card">
          <h2>Mock exam results</h2>
          {stats.mocks.length === 0 ? (
            <p className="muted">Your results appear here when your teacher has marked a mock exam.</p>
          ) : (
            <ul className="plain">
              {stats.mocks.map((m) => (
                <li key={m.id}>
                  <Link to={`/assignments/${m.id}`} className="row spread mock-row">
                    <span>{m.title}</span>
                    <span><b>{m.earned}</b> / {m.marks} <span className="muted small">· {Math.round((m.earned / m.marks) * 100)}%</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
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
                  <span className="muted small">{w.paper_label} · {chapterName(w.paper, w.chapter)}</span>
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
