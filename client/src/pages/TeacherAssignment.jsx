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
  const { questions, students } = data;
  const a = { ...data.assignment, question_count: questions.length };
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
                <h1>{a.title}</h1>
                <p className="muted">
                  {a.kind === 'mock' ? `Mock exam · ${a.time_limit_min} minutes` : 'Practice assignment'} · set by {a.teacher_name}
                  <br />{a.due_at ? `Due ${formatDate(a.due_at)}` : 'No due date'} · {questions.length} questions · {a.marks} marks
                </p>
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

      {a.kind === 'mock' ? <MockResults a={a} students={students} run={run} onReopen={reopen} onRemove={remove} /> : (<>
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
      </>)}

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

// Mock exam: who has sat it, how far marking has got, and the release button.
function MockResults({ a, students, run, onReopen, onRemove }) {
  const handedIn = students.filter((s) => s.submitted_at);
  const marked = handedIn.filter((s) => s.mock_marked >= questionsCount(a, s));
  const done = marked.filter((s) => s.mock_total !== null);
  const avg = done.length ? Math.round((done.reduce((t, s) => t + s.mock_total, 0) / (done.length * a.marks)) * 100) : null;
  const released = Boolean(a.results_released_at);

  const release = () => {
    const left = handedIn.length - marked.length;
    const msg = left
      ? `${left} handed-in exam${left === 1 ? ' is' : 's are'} not fully marked. Release the marked answers anyway? Unmarked answers will not be shown.`
      : `Release the results to ${handedIn.length} student${handedIn.length === 1 ? '' : 's'}? They will see their marks, the mark scheme and your comments.`;
    if (!window.confirm(msg)) return;
    run(() => api(`/teacher/assignments/${a.id}/release`, { method: 'POST', body: { force: left > 0 } }));
  };

  return (
    <>
      <div className="stats">
        <Stat icon="users" value={students.length} label="students sitting it" />
        <Stat icon="check" value={`${handedIn.length} / ${students.length}`} label="handed in" />
        <Stat icon="list" value={`${marked.length} / ${handedIn.length}`} label="fully marked" tone={handedIn.length > marked.length ? 'warn' : ''} />
        <Stat icon="chart" value={avg === null ? '—' : `${avg}%`} label="average of marked exams" />
      </div>

      <section className="card">
        <div className="toolbar">
          <h2 className="grow">Students</h2>
          {released
            ? <span className="badge ok">Results released {formatDate(a.results_released_at)}</span>
            : <button type="button" className="btn primary sm" disabled={!handedIn.length} onClick={release}>Release results</button>}
        </div>
        <p className="muted small">
          When a student hands in (or time runs out), the AI suggests a mark for every answer. Open each exam, check or change the marks,
          then release the results. Students see nothing until you release.
        </p>
        {students.length === 0 ? <p className="muted">No students have this mock exam.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Class</th><th>Status</th><th className="num">Answered</th><th>Marking</th><th className="num">Mark</th><th><span className="visually-hidden">Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const total = questionsCount(a, s);
                  const status = s.submitted_at ? 'Handed in' : s.started_at ? 'Writing now' : 'Not started';
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/teacher/student/${s.id}`} className="who-cell">
                          <span className="avatar sm">{initials(s.name)}</span>
                          <span><b>{s.name}</b><br /><span className="muted small">@{s.username}</span></span>
                        </Link>
                      </td>
                      <td>{s.class_name}</td>
                      <td><span className={`badge ${s.submitted_at ? 'ok' : s.started_at ? 'warn' : ''}`}>{status}</span>{s.submitted_at && <span className="muted small"> {formatDate(s.submitted_at)}</span>}</td>
                      <td className="num">{s.mock_answered ?? 0} / {total}</td>
                      <td>
                        {!s.submitted_at ? <span className="muted">—</span>
                          : s.mock_marked >= total ? <span className="badge ok">Marked</span>
                            : <span className="small">{s.mock_marked} / {total} confirmed{s.mock_ai_pending ? <span className="muted"> · AI working…</span> : ''}</span>}
                      </td>
                      <td className="num">{s.submitted_at && s.mock_total !== null ? <b>{s.mock_total} / {a.marks}</b> : <span className="muted">—</span>}</td>
                      <td>
                        <div className="row nowrap">
                          {s.submitted_at && <Link to={`/teacher/assignments/${a.id}/mark/${s.id}`} className={`btn sm ${s.mock_marked >= total ? '' : 'primary'}`}>{s.mock_marked >= total ? 'Review' : 'Mark'}</Link>}
                          {s.submitted_at && !released && <button type="button" className="btn sm" onClick={() => onReopen(s)} title="Give the student a fresh clock to continue">Reopen</button>}
                          <button type="button" className="btn sm ghost" onClick={() => onRemove(s)} title="Remove from this mock exam"><Icon name="x" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Number of questions in the exam (the same for every student).
const questionsCount = (a) => a.question_count;
