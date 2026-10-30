import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { initials } from '../components/Layout.jsx';

const pct = (e, a) => (a ? Math.round((e / a) * 100) : null);

export function timeAgo(date) {
  if (!date) return 'never';
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export default function Teacher() {
  const { user } = useAuth();
  const [students, setStudents] = useState(null);
  const [paperCols, setPaperCols] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [klass, setKlass] = useState('');
  const [status, setStatus] = useState('approved');

  const load = () => Promise.all([api('/teacher/students'), api('/teacher/overview')])
    .then(([s, o]) => { setStudents(s.students); setPaperCols(s.papers); setOverview(o); })
    .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const setStudentStatus = async (id, next) => {
    try {
      await api(`/teacher/students/${id}/status`, { method: 'POST', body: { status: next } });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = useMemo(() => (students || []).filter((s) => (
    s.status === status
    && (!klass || s.class_name === klass)
    && (!search || `${s.name} ${s.username}`.toLowerCase().includes(search.toLowerCase()))
  )), [students, status, klass, search]);

  if (error) return <p className="error">{error}</p>;
  if (!students || !overview) return <p className="muted">Loading…</p>;

  const approved = students.filter((s) => s.status === 'approved');
  const pending = students.filter((s) => s.status === 'pending');
  const activeWeek = approved.filter((s) => s.week_attempts > 0).length;
  const earned = approved.reduce((t, s) => t + s.earned, 0);
  const available = approved.reduce((t, s) => t + s.available, 0);
  const classes = [...new Set(students.map((s) => s.class_name))].sort();
  const subjects = user.role === 'admin' ? 'All subjects (administrator)' : (user.teaches.map((t) => t.name).join(', ') || 'No subject assigned yet');

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <p className="eyebrow">Teacher dashboard</p>
        <h1>My students</h1>
        <p className="muted">{subjects}</p>
      </section>

      <div className="stats">
        <Stat icon="users" value={approved.length} label="students in your classes" />
        <Stat icon="hourglass" value={pending.length} label="waiting for approval" tone={pending.length ? 'warn' : ''} />
        <Stat icon="flame" value={`${activeWeek} / ${approved.length}`} label="practised in the last 7 days" />
        <Stat icon="chart" value={pct(earned, available) === null ? '—' : `${pct(earned, available)}%`} label="average score on answered questions" />
      </div>

      {pending.length > 0 && (
        <section className="card">
          <h2><Icon name="hourglass" /> Waiting for approval</h2>
          <p className="muted small">These students signed up and chose you as their teacher. Approve the ones in your class.</p>
          <ul className="plain">
            {pending.map((s) => (
              <li key={s.id} className="pending-row">
                <span className="avatar">{initials(s.name)}</span>
                <span className="grow">
                  <b>{s.name}</b> <span className="muted small">@{s.username}</span>
                  <br />
                  <span className="muted small">Class {s.class_name} · {s.subject_name} · signed up {timeAgo(s.created_at)}</span>
                </span>
                <button type="button" className="btn primary sm" onClick={() => setStudentStatus(s.id, 'approved')}><Icon name="check" /> Approve</button>
                <button type="button" className="btn sm" onClick={() => setStudentStatus(s.id, 'rejected')}><Icon name="x" /> Reject</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid two">
        <section className="card">
          <h2>Classes</h2>
          {overview.classes.length === 0 ? <p className="muted">No students yet.</p> : (
            <ul className="plain">
              {overview.classes.map((c) => (
                <li key={c.class_name}>
                  <button type="button" className="rail-item" onClick={() => { setKlass(c.class_name); setStatus('approved'); }}>
                    <Meter earned={c.earned} available={c.available} label={`${c.class_name || 'No class'} · ${c.students} student${c.students === 1 ? '' : 's'}${c.pending ? ` (${c.pending} pending)` : ''}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Topics your students find hardest</h2>
          {overview.topics.length === 0 ? <p className="muted">Shows up once your students have answered some questions.</p> : (
            <ul className="plain">
              {overview.topics.map((t) => (
                <li key={`${t.paper}-${t.subtopic}`}>
                  <Meter earned={t.earned} available={t.available} label={`${t.paper_label} · ${t.subtopic}`} />
                  <span className="muted small">{t.students} student{t.students === 1 ? '' : 's'} answered</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="toolbar">
          <h2 className="grow">Students</h2>
          <span className="search-box"><Icon name="search" /><input type="search" placeholder="Search name or login" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
          <select value={klass} onChange={(e) => setKlass(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c} value={c}>{c || 'No class'}</option>)}
          </select>
          <div className="seg">
            {[['approved', 'Active'], ['pending', 'Pending'], ['rejected', 'Blocked']].map(([v, l]) => (
              <button type="button" key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? <p className="muted">No students here.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th><th>Class</th><th>Answered</th><th>Score</th>
                  {paperCols.map((p) => <th key={p.number} title={p.label}>{p.label.replace('IGCSE Paper ', 'IG').replace('Paper ', 'P')}</th>)}<th>Last 7 days</th><th>Last active</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/teacher/student/${s.id}`} className="who-cell">
                        <span className="avatar sm">{initials(s.name)}</span>
                        <span><b>{s.name}</b><br /><span className="muted small">@{s.username}{user.role === 'admin' && s.teacher_name ? ` · ${s.teacher_name}` : ''}</span></span>
                      </Link>
                    </td>
                    <td>{s.class_name}</td>
                    <td>{s.answered}</td>
                    <td className="score-cell"><Meter earned={s.earned} available={s.available} /></td>
                    {paperCols.map(({ number: p }) => {
                      const row = s.papers.find((x) => x.paper === p);
                      const v = row ? pct(row.earned, row.available) : null;
                      return <td key={p}><PctChip value={v} /></td>;
                    })}
                    <td>{s.week_attempts} tries</td>
                    <td className="muted small">{timeAgo(s.last_attempt || s.last_seen_at)}</td>
                    <td><div className="row nowrap">
                      <Link to={`/teacher/student/${s.id}`} className="btn sm">View</Link>
                      {s.status === 'approved' && <button type="button" className="btn sm ghost" onClick={() => setStudentStatus(s.id, 'rejected')}>Block</button>}
                      {s.status !== 'approved' && <button type="button" className="btn sm primary" onClick={() => setStudentStatus(s.id, 'approved')}>Approve</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function Stat({ icon, value, label, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="icon-tile"><Icon name={icon} /></span>
      <div><b>{value}</b><span>{label}</span></div>
    </div>
  );
}

export function PctChip({ value }) {
  if (value === null || value === undefined) return <span className="muted">—</span>;
  const tone = value >= 70 ? 'ok' : value >= 40 ? 'warn' : 'bad';
  return <span className={`badge ${tone}`}>{value}%</span>;
}
