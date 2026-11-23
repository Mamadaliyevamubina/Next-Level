import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { isStudent, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { initials } from '../components/Layout.jsx';

// The competition: who has solved the most questions (full marks) this week, this month or ever.
// Every student is a train on the same line; the leader sets the length of the track.
const PERIODS = [['week', 'This week'], ['month', 'This month'], ['all', 'All time']];
const REFRESH_MS = 30000;

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
const pct = (r) => (r.available ? Math.round((r.earned / r.available) * 100) : 0);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The student's own standing: their place, and how many questions to the next place and to first.
function MyStanding({ me, leaders, period }) {
  const when = { week: 'this week', month: 'this month', all: 'so far' }[period];
  if (!me) return null;
  const ahead = [...leaders].reverse().find((r) => r.place < me.place);
  const first = leaders[0];
  // One more than the student above passes them (ties are split by marks earned).
  const toNext = ahead ? ahead.solved - me.solved + 1 : 0;
  const toFirst = first ? first.solved - me.solved : 0;
  return (
    <section className="card standing" aria-live="polite">
      <div className={`standing-place${me.place === 1 && me.solved > 0 ? ' first' : ''}`}>
        <small>Your place</small>
        <b>{me.solved > 0 ? ordinal(me.place) : '–'}</b>
      </div>
      <div className="grow">
        <h2>{me.solved > 0 ? `${plural(me.solved, 'question')} solved ${when}` : `You have not solved a question ${when} yet`}</h2>
        <p className="muted">
          {me.solved === 0
            ? 'Get full marks on any question and you join the line.'
            : me.place === 1
              ? (leaders[1] && leaders[1].solved === me.solved ? 'You share first place. One more solved question puts you ahead.' : 'You are in first place. Keep going to stay there.')
              : `Solve ${plural(toNext, 'more question')} to pass ${ahead.name}${first && ahead.id !== first.id && toFirst > 0 ? `, and ${toFirst} to draw level with ${first.name} in first place` : ''}.`}
        </p>
      </div>
      <Link to="/" className="btn primary"><Icon name="arrow" size={16} /> Practise now</Link>
    </section>
  );
}

// The top three as the first stations on the line.
function Podium({ leaders }) {
  const top = leaders.filter((r) => r.solved > 0).slice(0, 3);
  if (!top.length) return null;
  return (
    <ol className="podium plain" aria-label="Top three">
      {top.map((r) => (
        <li key={r.id} className={`podium-step p${r.place}${r.me ? ' me' : ''}`}>
          <span className="podium-place">{ordinal(r.place)}</span>
          <span className="avatar">{initials(r.name)}</span>
          <b>{r.name}{r.me ? ' (you)' : ''}</b>
          <span className="muted small">{r.class_name ? `Class ${r.class_name}` : 'Student'}</span>
          <span className="podium-score"><b>{r.solved}</b> solved</span>
        </li>
      ))}
    </ol>
  );
}

export default function Competition() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ period: 'week', subject: '', class: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(null);
  const live = useRef(true);

  const load = () => {
    const q = new URLSearchParams();
    q.set('period', filters.period);
    if (filters.subject) q.set('subject', filters.subject);
    if (filters.class) q.set('class', filters.class);
    return api(`/leaderboard?${q}`)
      .then((d) => {
        if (!live.current) return;
        setData(d);
        setError('');
        setUpdated(new Date());
        // The server picks the student's own subject first; keep it selected from then on.
        if (!filters.subject) setFilters((f) => (f.subject ? f : { ...f, subject: d.subject === null ? 'all' : String(d.subject) }));
      })
      .catch((e) => live.current && setError(e.message));
  };

  useEffect(() => {
    live.current = true;
    load();
    // The table refreshes by itself while the page is open, so a class can watch the race.
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, REFRESH_MS);
    return () => { live.current = false; clearInterval(t); };
  }, [filters.period, filters.subject, filters.class]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const leaders = data?.leaders || [];
  const top = Math.max(1, ...leaders.map((r) => r.solved));
  const subjectName = data?.subjects.find((s) => s.id === data.subject)?.name.replace(/\s*\(.*\)$/, '') || 'All subjects';

  return (
    <div className="stack-lg competition">
      <header className="row spread">
        <div>
          <h1>Competition</h1>
          <p className="muted">Who has solved the most questions. A question counts as solved when an answer gets full marks.</p>
        </div>
        {updated && <span className="muted small live-note"><span className="live-dot" aria-hidden="true" /> Live · updates every 30 seconds</span>}
      </header>

      <div className="row comp-filters">
        <div className="seg" role="group" aria-label="Time period">
          {PERIODS.map(([k, label]) => (
            <button key={k} type="button" className={filters.period === k ? 'on' : ''} aria-pressed={filters.period === k} onClick={() => set('period')(k)}>{label}</button>
          ))}
        </div>
        {data && (
          <>
            <label className="inline-field">
              <span className="visually-hidden">Subject</span>
              <select value={filters.subject || (data.subject === null ? 'all' : String(data.subject))} onChange={(e) => set('subject')(e.target.value)}>
                <option value="all">All subjects</option>
                {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            {data.classes.length > 0 && (
              <label className="inline-field">
                <span className="visually-hidden">Class</span>
                <select value={filters.class} onChange={(e) => set('class')(e.target.value)}>
                  <option value="">Every class</option>
                  {data.classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </label>
            )}
          </>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          {isStudent(user) && <MyStanding me={data.me} leaders={leaders} period={data.period} />}

          <div className="stats comp-stats">
            <div className="stat"><span className="icon-tile"><Icon name="users" size={20} /></span><div><b>{data.competitors - data.not_started}</b><span>of {data.competitors} students taking part</span></div></div>
            <div className="stat"><span className="icon-tile"><Icon name="check" size={20} /></span><div><b>{data.solved_total}</b><span>questions solved in {subjectName}</span></div></div>
            <div className="stat"><span className="icon-tile"><Icon name="flame" size={20} /></span><div><b>{data.active_now}</b><span>{data.active_now === 1 ? 'student' : 'students'} solving right now</span></div></div>
          </div>

          <Podium leaders={leaders} />

          <section className="card">
            <h2 className="visually-hidden">Full table</h2>
            {leaders.filter((r) => r.tried > 0).length === 0 ? (
              <div className="empty">
                <p><b>Nobody has answered a question {data.period === 'all' ? 'yet' : data.period === 'week' ? 'this week' : 'this month'}.</b></p>
                <p className="muted">The first full-marks answer takes first place.</p>
              </div>
            ) : (
              <ol className="plain race" aria-label="Students by questions solved">
                {leaders.map((r) => (
                  <li key={r.id} className={`race-row${r.me ? ' me' : ''}${r.place <= 3 && r.solved > 0 ? ` top p${r.place}` : ''}`}>
                    <span className="race-place">{r.solved > 0 ? r.place : '–'}</span>
                    <span className="avatar sm">{initials(r.name)}</span>
                    <span className="race-name">
                      <b>{r.name}{r.me ? ' (you)' : ''}</b>
                      <small>
                        {r.class_name ? `Class ${r.class_name}` : 'Student'}
                        {r.active && <> · <span className="ok-text">solving now</span></>}
                      </small>
                    </span>
                    <span className="race-track" aria-hidden="true">
                      <span className="race-fill" style={{ width: `${(r.solved / top) * 100}%` }} />
                    </span>
                    <span className="race-num" title="Questions solved (full marks)"><b>{r.solved}</b><small>solved</small></span>
                    <span className="race-num hide-sm" title="Questions answered"><b>{r.tried}</b><small>tried</small></span>
                    <span className="race-num hide-sm" title="Share of marks earned"><b>{pct(r)}%</b><small>marks</small></span>
                  </li>
                ))}
              </ol>
            )}
            {data.not_started > 0 && <p className="muted small comp-foot">{plural(data.not_started, 'more student has', 'more students have')} not answered a question {data.period === 'all' ? 'yet' : 'in this period'}.</p>}
          </section>
        </>
      )}
    </div>
  );
}
