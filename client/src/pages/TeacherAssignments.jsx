import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { isAdmin, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { usePapers } from '../papers.js';
import { formatDate } from './MyAssignments.jsx';

// Teacher: every assignment they set, and a form to set a new one.
export default function TeacherAssignments() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => api('/teacher/assignments').then((d) => setList(d.assignments)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (error) return <p className="error">{error}</p>;
  if (!list) return <p className="muted">Loading…</p>;

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <div className="row spread">
          <div>
            <p className="eyebrow">Teacher</p>
            <h1>Assignments</h1>
            <p className="muted">{isAdmin(user) ? 'Every teacher\'s assignments.' : 'Quizzes you set for your students.'}</p>
          </div>
          {!creating && <button type="button" className="btn primary" onClick={() => setCreating(true)}><Icon name="list" /> New assignment</button>}
        </div>
      </section>

      {creating && <NewAssignment onCancel={() => setCreating(false)} />}

      <section className="card">
        {list.length === 0 ? <p className="muted">No assignments yet. Press “New assignment” to set one.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>{isAdmin(user) && <th>Teacher</th>}<th>Questions</th><th>Due</th><th>Started</th><th>Handed in</th><th>Set</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td><Link to={`/teacher/assignments/${a.id}`}><b>{a.title}</b></Link></td>
                    {isAdmin(user) && <td>{a.teacher_name}</td>}
                    <td>{a.questions} · {a.marks} marks</td>
                    <td>{a.due_at ? formatDate(a.due_at) : <span className="muted">—</span>}</td>
                    <td>{a.started} / {a.students}</td>
                    <td><span className={`badge ${a.students && a.submitted === a.students ? 'ok' : ''}`}>{a.submitted} / {a.students}</span></td>
                    <td className="muted small">{new Date(a.created_at).toLocaleDateString()}</td>
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

function NewAssignment({ onCancel }) {
  const navigate = useNavigate();
  const papers = usePapers();
  const [form, setForm] = useState({ title: '', instructions: '', due_at: '' });
  const [picked, setPicked] = useState([]); // questions, in the order chosen
  const [studentIds, setStudentIds] = useState([]);
  const [students, setStudents] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/teacher/students')
      .then((d) => setStudents(d.students.filter((s) => s.status === 'approved')))
      .catch((e) => setError(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!picked.length) return setError('Pick at least one question.');
    if (!studentIds.length) return setError('Pick at least one student.');
    setSaving(true);
    setError('');
    try {
      const { id } = await api('/teacher/assignments', {
        method: 'POST',
        body: {
          title: form.title,
          instructions: form.instructions,
          due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
          question_ids: picked.map((q) => q.id),
          student_ids: studentIds,
        },
      });
      navigate(`/teacher/assignments/${id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="card stack" onSubmit={submit}>
      <h2>New assignment</h2>
      <div className="grid two">
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Week 5 – Networks quiz" required /></label>
        <label>Due <span className="label-note">(optional)</span><input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></label>
      </div>
      <label>Instructions <span className="label-note">(optional)</span>
        <textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What students should do, e.g. answer without notes in 30 minutes." />
      </label>

      <QuestionPicker papers={papers} picked={picked} setPicked={setPicked} />
      <StudentPicker students={students} selected={studentIds} setSelected={setStudentIds} />

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : `Set assignment (${picked.length} question${picked.length === 1 ? '' : 's'}, ${studentIds.length} student${studentIds.length === 1 ? '' : 's'})`}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// Browse a paper and chapter and tick the questions to include.
export function QuestionPicker({ papers, picked, setPicked }) {
  const [paper, setPaper] = useState('');
  const [chapter, setChapter] = useState('');
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paper && papers?.length) setPaper(String(papers[0].number));
  }, [papers, paper]);

  useEffect(() => {
    if (!paper) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (chapter) params.set('chapter', chapter);
    if (search.trim()) params.set('search', search.trim());
    const t = setTimeout(() => {
      api(`/papers/${paper}/questions?${params}`)
        .then((d) => setQuestions(d.questions))
        .catch(() => setQuestions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [paper, chapter, search]);

  const current = papers?.find((p) => String(p.number) === paper);
  const pickedIds = new Set(picked.map((q) => q.id));
  const toggle = (q) => setPicked(pickedIds.has(q.id)
    ? picked.filter((x) => x.id !== q.id)
    : [...picked, { ...q, paper_label: current?.label }]);
  const marks = picked.reduce((t, q) => t + q.marks, 0);

  return (
    <div className="stack">
      <p className="form-section"><Icon name="book" /> Questions</p>
      <div className="toolbar">
        <select value={paper} onChange={(e) => { setPaper(e.target.value); setChapter(''); }}>
          {(papers || []).map((p) => <option key={p.number} value={p.number}>{p.label} · {p.title}</option>)}
        </select>
        <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
          <option value="">All chapters</option>
          {(current?.chapters || []).map((c) => <option key={c.number} value={c.number}>{c.number}. {c.name}</option>)}
        </select>
        <span className="search-box"><Icon name="search" /><input type="search" placeholder="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
      </div>
      <div className="grid two">
        <div>
          <p className="muted small">{loading ? 'Loading…' : `${questions.length} question${questions.length === 1 ? '' : 's'} found`}</p>
          <ul className="plain criteria" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {questions.slice(0, 200).map((q) => (
              <li key={q.id}>
                <label className={pickedIds.has(q.id) ? 'checked' : ''}>
                  <input type="checkbox" checked={pickedIds.has(q.id)} onChange={() => toggle(q)} />
                  <span>
                    <b>{q.exam_label} · Q{q.label}</b> <span className="muted small">· {q.marks} mark{q.marks === 1 ? '' : 's'} · {q.subtopic}</span>
                    <br /><span className="muted small">{q.preview}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="muted small">Chosen: {picked.length} question{picked.length === 1 ? '' : 's'} · {marks} marks</p>
          {picked.length === 0 ? <p className="muted">Tick questions on the left.</p> : (
            <ol className="stack" style={{ paddingLeft: 20, margin: 0 }}>
              {picked.map((q) => (
                <li key={q.id}>
                  <span className="row spread nowrap">
                    <span className="small">{q.paper_label} · {q.exam_label} · Q{q.label} <span className="muted">({q.marks})</span></span>
                    <button type="button" className="btn sm ghost" onClick={() => toggle(q)} title="Remove"><Icon name="x" size={14} /></button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// Tick whole classes or single students.
export function StudentPicker({ students, selected, setSelected, exclude = [] }) {
  const available = useMemo(() => (students || []).filter((s) => !exclude.includes(s.id)), [students, exclude]);
  const classes = useMemo(() => {
    const map = new Map();
    for (const s of available) map.set(s.class_name, [...(map.get(s.class_name) || []), s]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [available]);
  const has = new Set(selected);
  const toggleOne = (id) => setSelected(has.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const toggleClass = (list) => {
    const all = list.every((s) => has.has(s.id));
    const ids = list.map((s) => s.id);
    setSelected(all ? selected.filter((x) => !ids.includes(x)) : [...new Set([...selected, ...ids])]);
  };

  return (
    <div className="stack">
      <p className="form-section"><Icon name="users" /> Students</p>
      {!students ? <p className="muted">Loading…</p> : available.length === 0 ? <p className="muted">No approved students to choose from.</p> : (
        <div className="grid three">
          {classes.map(([name, list]) => (
            <div key={name} className="pending-row" style={{ display: 'block' }}>
              <label className="row nowrap" style={{ fontWeight: 700 }}>
                <input type="checkbox" checked={list.every((s) => has.has(s.id))} onChange={() => toggleClass(list)} />
                Class {name || '(none)'} <span className="muted small">· {list.length}</span>
              </label>
              <ul className="plain" style={{ marginTop: 6 }}>
                {list.map((s) => (
                  <li key={s.id}>
                    <label className="row nowrap" style={{ fontWeight: 400 }}>
                      <input type="checkbox" checked={has.has(s.id)} onChange={() => toggleOne(s.id)} />
                      {s.name} <span className="muted small">@{s.username}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
