import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import Markdown from '../components/Markdown.jsx';
import Meter, { ScoreBadge } from '../components/Meter.jsx';
import { initials } from '../components/Layout.jsx';
import { Stat } from './Teacher.jsx';
import { StudentPicker } from './TeacherAssignments.jsx';
import { formatDate } from './MyAssignments.jsx';

// For <input type="datetime-local">: local time as YYYY-MM-DDTHH:mm.
const toLocalInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// Teacher: one assignment, with each student's progress and score.
export default function TeacherAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = () => api(`/teacher/assignments/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  const { assignment: a, questions, students } = data;
  const submitted = students.filter((s) => s.submitted_at).length;
  const started = students.filter((s) => s.answered > 0).length;
  const earned = students.reduce((t, s) => t + s.earned, 0);
  const possible = students.filter((s) => s.answered > 0).length * a.marks;

  const reopen = (s) => run(() => api(`/teacher/assignments/${id}/students/${s.id}/reopen`, { method: 'POST' }));
  const remove = (s) => window.confirm(`Remove ${s.name} from this assignment?`)
    && run(() => api(`/teacher/assignments/${id}`, { method: 'PATCH', body: { remove_student_ids: [s.id] } }));
  const destroy = async () => {
    if (!window.confirm(`Delete “${a.title}”? Students will no longer see it. Their answers stay in their practice history.`)) return;
    try {
      await api(`/teacher/assignments/${id}`, { method: 'DELETE' });
      navigate('/teacher/assignments');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="stack-lg">
      <nav className="crumbs small"><Link to="/teacher/assignments">Assignments</Link> › {a.title}</nav>

      <section className="card hero-card">
        {editing ? (
          <EditDetails assignment={a} onCancel={() => setEditing(false)}
            onSave={(body) => run(async () => { await api(`/teacher/assignments/${id}`, { method: 'PATCH', body }); setEditing(false); })} />
        ) : (
          <>
            <div className="row spread">
              <div>
                <p className="eyebrow">Assignment · set by {a.teacher_name}</p>
                <h1>{a.title}</h1>
                <p className="muted">{a.due_at ? `Due ${formatDate(a.due_at)}` : 'No due date'} · {questions.length} questions · {a.marks} marks</p>
              </div>
              <div className="row">
                <button type="button" className="btn sm" onClick={() => setEditing(true)}>Edit</button>
                <button type="button" className="btn sm ghost" onClick={destroy}><Icon name="trash" size={14} /> Delete</button>
              </div>
            </div>
            {a.instructions && <Markdown>{a.instructions}</Markdown>}
          </>
        )}
      </section>
      {error && <p className="error">{error}</p>}

      <div className="stats">
        <Stat icon="users" value={students.length} label="students given this" />
        <Stat icon="flame" value={`${started} / ${students.length}`} label="have started" />
        <Stat icon="check" value={`${submitted} / ${students.length}`} label="handed in" />
        <Stat icon="chart" value={possible ? `${Math.round((earned / possible) * 100)}%` : '—'} label="average score (students who started)" />
      </div>

      <section className="card">
        <div className="toolbar">
          <h2 className="grow">Results</h2>
          {!adding && <button type="button" className="btn sm" onClick={() => setAdding(true)}><Icon name="users" size={14} /> Add students</button>}
        </div>
        {adding && (
          <AddStudents exclude={students.map((s) => s.id)} onCancel={() => setAdding(false)}
            onAdd={(ids) => run(async () => { await api(`/teacher/assignments/${id}`, { method: 'PATCH', body: { add_student_ids: ids } }); setAdding(false); })} />
        )}
        {students.length === 0 ? <p className="muted">No students have this assignment.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th><th>Class</th><th>Score</th>
                  {questions.map((q, i) => <th key={q.id} title={`${q.exam_label} · Q${q.label}`}>Q{i + 1}</th>)}
                  <th>Handed in</th><th />
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/teacher/student/${s.id}`} className="who-cell">
                        <span className="avatar sm">{initials(s.name)}</span>
                        <span><b>{s.name}</b><br /><span className="muted small">@{s.username}</span></span>
                      </Link>
                    </td>
                    <td>{s.class_name}</td>
                    <td className="score-cell"><Meter earned={s.earned} available={s.answered ? a.marks : 0} /></td>
                    {questions.map((q) => {
                      const r = s.results.find((x) => x.question_id === q.id);
                      return <td key={q.id}>{r ? <ScoreBadge awarded={r.awarded} marks={r.marks} /> : <span className="muted">—</span>}</td>;
                    })}
                    <td className="small">
                      {s.submitted_at
                        ? <span className={`badge ${a.due_at && new Date(s.submitted_at) > new Date(a.due_at) ? 'warn' : 'ok'}`}>{formatDate(s.submitted_at)}</span>
                        : <span className="muted">{s.answered ? 'In progress' : 'Not started'}</span>}
                    </td>
                    <td>
                      <div className="row nowrap">
                        {s.submitted_at && <button type="button" className="btn sm" onClick={() => reopen(s)} title="Let the student change their answers">Reopen</button>}
                        <button type="button" className="btn sm ghost" onClick={() => remove(s)} title="Remove from this assignment"><Icon name="x" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Questions</h2>
        <ol className="stack" style={{ paddingLeft: 20, margin: 0 }}>
          {questions.map((q) => (
            <li key={q.id}>
              <Link to={`/question/${q.id}`}><b>{q.paper_label} · {q.exam_label} · Q{q.label}</b></Link>
              <span className="muted small"> · {q.marks} mark{q.marks === 1 ? '' : 's'} · {q.subtopic}</span>
              <br /><span className="muted small">{q.preview}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function EditDetails({ assignment: a, onSave, onCancel }) {
  const [form, setForm] = useState({ title: a.title, instructions: a.instructions, due_at: toLocalInput(a.due_at) });
  const submit = (e) => {
    e.preventDefault();
    onSave({ title: form.title, instructions: form.instructions, due_at: form.due_at ? new Date(form.due_at).toISOString() : null });
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid two">
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Due<input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></label>
      </div>
      <label>Instructions<textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label>
      <div className="row">
        <button type="submit" className="btn primary">Save</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function AddStudents({ exclude, onAdd, onCancel }) {
  const [students, setStudents] = useState(null);
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    api('/teacher/students').then((d) => setStudents(d.students.filter((s) => s.status === 'approved'))).catch(() => setStudents([]));
  }, []);
  return (
    <div className="stack" style={{ marginBottom: 16 }}>
      <StudentPicker students={students} selected={selected} setSelected={setSelected} exclude={exclude} />
      <div className="row">
        <button type="button" className="btn primary sm" disabled={!selected.length} onClick={() => onAdd(selected)}>Add {selected.length || ''} student{selected.length === 1 ? '' : 's'}</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
