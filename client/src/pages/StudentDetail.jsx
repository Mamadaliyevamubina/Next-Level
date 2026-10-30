import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import Meter, { ScoreBadge } from '../components/Meter.jsx';
import { initials } from '../components/Layout.jsx';
import { Stat, timeAgo } from './Teacher.jsx';

export default function StudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api(`/teacher/students/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    await api(`/teacher/students/${id}/status`, { method: 'POST', body: { status } });
    load();
  };

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const { student: s, totals: t, papers, chapters, weakest, recent, streak, activity } = data;
  const maxDay = Math.max(1, ...activity.map((d) => d.attempts));

  return (
    <div className="stack-lg">
      <nav className="crumbs small"><Link to="/teacher">My students</Link> › {s.name}</nav>

      <section className="card account-head">
        <span className="avatar xl">{initials(s.name)}</span>
        <div className="grow">
          <h1>{s.name}</h1>
          <p className="muted">@{s.username} · Class {s.class_name || '—'} · {s.subject_name || 'No subject'} · Teacher {s.teacher_name || '—'}</p>
          <p className="muted small">
            Joined {new Date(s.created_at).toLocaleDateString()} · last seen {timeAgo(s.last_seen_at)}{s.email ? ` · ${s.email}` : ''}
          </p>
        </div>
        <div className="row">
          <span className={`status-pill ${s.status}`}>{s.status}</span>
          {s.status !== 'approved' && <button type="button" className="btn primary sm" onClick={() => setStatus('approved')}>Approve</button>}
          {s.status !== 'rejected' && <button type="button" className="btn sm" onClick={() => setStatus('rejected')}>Block</button>}
        </div>
      </section>

      <div className="stats">
        <Stat icon="book" value={`${t.answered}`} label={`of ${t.questions} questions answered`} />
        <Stat icon="chart" value={t.available ? `${Math.round((t.earned / t.available) * 100)}%` : '—'} label={`${t.earned} / ${t.available} marks`} />
        <Stat icon="check" value={t.full_marks} label="questions with full marks" />
        <Stat icon="flame" value={`${streak} day${streak === 1 ? '' : 's'}`} label={`streak · ${t.attempts} tries in total`} />
      </div>

      <section className="card">
        <h2>Activity, last 4 weeks</h2>
        <div className="bars" role="img" aria-label="Tries per day for the last 28 days">
          {activity.map((d) => (
            <span key={d.day} className="bar" title={`${d.day}: ${d.attempts} tries`}>
              <span style={{ height: `${(d.attempts / maxDay) * 100}%` }} />
            </span>
          ))}
        </div>
        <div className="row spread muted small"><span>{activity[0]?.day}</span><span>today</span></div>
      </section>

      <div className="grid two">
        <section className="card">
          <h2>By paper</h2>
          <ul className="plain">
            {papers.map((p) => (
              <li key={p.paper}>
                <Meter earned={p.earned} available={p.available} label={`Paper ${p.paper} · ${p.title}`} />
                <span className="muted small">{p.answered} / {p.questions} answered</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Weakest topics</h2>
          {weakest.length === 0 ? <p className="muted">No lost marks yet.</p> : (
            <ul className="plain">
              {weakest.map((w) => (
                <li key={`${w.paper}-${w.subtopic}`}>
                  <Meter earned={w.earned} available={w.available} label={`Paper ${w.paper} · ${w.subtopic}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2>By chapter</h2>
        <div className="chapter-grid">
          {chapters.map((c) => (
            <div key={`${c.paper}-${c.number}`} className="chapter-cell">
              <Meter earned={c.earned} available={c.available} label={`P${c.paper} · ${c.number}. ${c.name}`} />
              <span className="muted small">{c.answered} / {c.questions} answered</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Recent answers</h2>
        {recent.length === 0 ? <p className="muted">This student has not answered anything yet.</p> : (
          <ul className="plain">
            {recent.map((r) => (
              <li key={r.id}>
                <details className="answer-row">
                  <summary>
                    <span className="grow">
                      <b>Paper {r.paper} · {r.exam_label} · Q{r.label}</b>
                      <span className="muted small"> · {r.subtopic} · {new Date(r.created_at).toLocaleString()}</span>
                    </span>
                    <ScoreBadge awarded={r.awarded} marks={r.marks} />
                  </summary>
                  <pre className="past">{r.answer || '(no answer written)'}</pre>
                  <Link to={`/question/${r.question_id}`} className="small"><Icon name="arrow" size={14} /> Open the question</Link>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
