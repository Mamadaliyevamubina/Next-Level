import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { isAdmin, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import { Stat } from './Teacher.jsx';

const LEVEL_NAMES = { igcse: 'IGCSE', alevel: 'AS & A Level' };

// Main page for teachers (and admins): the classes they teach, grouped by subject.
// The question bank is not shown here; it has its own "Practice questions" section.
export default function TeacherHome() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/teacher/classes').then((d) => setClasses(d.classes)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!classes) return <p className="muted">Loading…</p>;

  const groups = [];
  for (const c of classes) {
    const g = groups.find((x) => x.subject_id === c.subject_id)
      || groups[groups.push({ subject_id: c.subject_id, name: c.subject_name, level: c.level, classes: [] }) - 1];
    g.classes.push(c);
  }
  const students = classes.reduce((t, c) => t + c.students, 0);
  const pending = classes.reduce((t, c) => t + c.pending, 0);
  const active = classes.reduce((t, c) => t + c.active_week, 0);
  const taught = isAdmin(user) ? 'All subjects (administrator)' : (user.teaches.map((t) => t.name).join(', ') || 'No subject assigned yet');
  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <h1>Welcome, {firstName}</h1>
        <p className="muted">{taught}</p>
      </section>

      <div className="stats">
        <Stat icon="school" value={classes.length} label={classes.length === 1 ? 'class you teach' : 'classes you teach'} />
        <Stat icon="users" value={students} label="students in your classes" />
        <Stat icon="hourglass" value={pending} label="waiting for approval" tone={pending ? 'warn' : ''} />
        <Stat icon="flame" value={`${active} / ${students}`} label="practised in the last 7 days" />
      </div>

      {pending > 0 && (
        <p className="notice">
          <Icon name="hourglass" /> {pending} student{pending === 1 ? ' is' : 's are'} waiting for you to approve them.{' '}
          <Link to="/teacher?status=pending">Review sign-ups</Link>
        </p>
      )}

      {groups.length === 0 && (
        <section className="card">
          <h2>My classes</h2>
          <p className="muted">
            No students have joined your classes yet. When students sign up and choose you as their teacher, their classes appear here.
          </p>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.subject_id} className="card">
          <div className="row spread">
            <h2><Icon name="book" /> {g.name}</h2>
            <span className="badge">{LEVEL_NAMES[g.level]}</span>
          </div>
          <ul className="plain class-list">
            {g.classes.map((c) => (
              <li key={`${c.subject_id}-${c.class_name}`} className="class-row">
                <div className="class-name">
                  <b>{c.class_name ? `Class ${c.class_name}` : 'No class'}</b>
                  <span className="muted small">
                    {c.students} student{c.students === 1 ? '' : 's'}
                    {c.grades?.length > 0 && ` · Grade ${c.grades.sort((a, b) => a - b).join(', ')}`}
                    {c.pending > 0 && ` · ${c.pending} pending`}
                    {` · ${c.active_week} practised this week`}
                  </span>
                </div>
                <div className="class-meter"><Meter earned={c.earned} available={c.available} /></div>
                <div className="row nowrap">
                  <Link className="btn sm" to={`/teacher?class=${encodeURIComponent(c.class_name)}`}><Icon name="users" size={16} /> Students</Link>
                  <Link className="btn sm" to="/teacher/assignments"><Icon name="list" size={16} /> Assign work</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card row spread">
        <span>
          <b>Practice questions</b>
          <br />
          <span className="muted small">Browse the past-paper question bank your students practise from.</span>
        </span>
        <Link className="btn" to="/practice"><Icon name="layers" size={16} /> Open question bank</Link>
      </section>
    </div>
  );
}
