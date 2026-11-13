import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';

export const formatDate = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

// Where a student stands on an assignment: handed in, overdue, or due soon.
export function dueStatus(a) {
  if (a.submitted_at) {
    const late = a.due_at && new Date(a.submitted_at) > new Date(a.due_at);
    return { tone: late ? 'warn' : 'ok', text: late ? 'Handed in late' : 'Handed in' };
  }
  if (!a.due_at) return { tone: '', text: 'No due date' };
  const hours = (new Date(a.due_at) - Date.now()) / 36e5;
  if (hours < 0) return { tone: 'bad', text: 'Overdue' };
  if (hours < 48) return { tone: 'warn', text: `Due ${formatDate(a.due_at)}` };
  return { tone: '', text: `Due ${formatDate(a.due_at)}` };
}

// Student: every assignment their teacher gave them.
export default function MyAssignments() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assignments').then((d) => setList(d.assignments)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!list) return <p className="muted">Loading…</p>;

  const open = list.filter((a) => !a.submitted_at);
  const done = list.filter((a) => a.submitted_at);

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <p className="eyebrow">From your teacher</p>
        <h1>My assignments</h1>
        <p className="muted">
          {open.length ? `${open.length} to do` : 'Nothing to do right now'}
          {done.length ? ` · ${done.length} handed in` : ''}
        </p>
      </section>

      {list.length === 0 && <section className="card"><p className="muted">Your teacher has not given you any assignments yet.</p></section>}
      {open.length > 0 && <AssignmentList title="To do" items={open} />}
      {done.length > 0 && <AssignmentList title="Handed in" items={done} />}
    </div>
  );
}

function AssignmentList({ title, items }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ul className="plain">
        {items.map((a) => {
          const due = dueStatus(a);
          return (
            <li key={a.id}>
              <Link to={`/assignments/${a.id}`} className="rail-item">
                <span className="row spread">
                  <b>{a.title}</b>
                  <span className={`badge ${due.tone}`}>{due.text}</span>
                </span>
                <Meter earned={a.earned} available={a.answered ? a.marks : 0} />
                <span className="muted small">
                  <Icon name="list" size={14} /> {a.answered} / {a.questions} questions answered · {a.earned} / {a.marks} marks · from {a.teacher_name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
