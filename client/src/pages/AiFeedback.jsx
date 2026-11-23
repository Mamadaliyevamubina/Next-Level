import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import { ScoreBadge } from '../components/Meter.jsx';
import { initials } from '../components/Layout.jsx';

// Teacher: the AI's feedback on every answer it marked. Students get a mark and a hint only; the full
// feedback (what was right, what was missed, misconceptions) comes here. New feedback stays bold until read.
export default function AiFeedback() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [student, setStudent] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api(`/teacher/feedback?limit=150${onlyNew ? '&unseen=1' : ''}`)
    .then((d) => { setData(d); setError(''); window.dispatchEvent(new Event('nl-feedback')); })
    .catch((e) => setError(e.message));
  useEffect(() => { load(); }, [onlyNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const markSeen = async (body) => {
    setBusy(true);
    try {
      await api('/teacher/feedback/seen', { method: 'POST', body });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const list = (data?.feedback || []).filter((f) => !student || String(f.student_id) === student);
  const students = [...new Map((data?.feedback || []).map((f) => [f.student_id, f.student_name])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="stack-lg ai-feedback">
      <header className="row spread">
        <div>
          <h1>AI feedback</h1>
          <p className="muted">What the AI marker noticed in your students' answers. Students see their mark and a hint, never the answer, so this is only shown to you.</p>
        </div>
        {data?.unseen > 0 && (
          <button type="button" className="btn" disabled={busy} onClick={() => markSeen({ all: true })}>
            <Icon name="check" size={16} /> Mark all {data.unseen} as read
          </button>
        )}
      </header>

      <div className="row">
        <div className="seg" role="group" aria-label="Show">
          <button type="button" className={onlyNew ? '' : 'on'} aria-pressed={!onlyNew} onClick={() => setOnlyNew(false)}>All</button>
          <button type="button" className={onlyNew ? 'on' : ''} aria-pressed={onlyNew} onClick={() => setOnlyNew(true)}>Unread{data?.unseen ? ` (${data.unseen})` : ''}</button>
        </div>
        {students.length > 1 && (
          <label>
            <span className="visually-hidden">Student</span>
            <select value={student} onChange={(e) => setStudent(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Every student</option>
              {students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}
      {data && list.length === 0 && (
        <section className="card empty">
          <p><b>{onlyNew ? 'No unread feedback.' : 'No AI feedback yet.'}</b></p>
          <p className="muted">When a student presses “Check my answer”, the AI's notes on the answer appear here.</p>
        </section>
      )}

      <ul className="plain feedback-list">
        {list.map((f) => (
          <li key={f.id} className={`card feedback-item${f.feedback_seen_at ? '' : ' unread'}`}>
            <header className="row spread">
              <span className="row">
                <span className="avatar sm">{initials(f.student_name)}</span>
                <span>
                  <Link to={`/teacher/student/${f.student_id}`}><b>{f.student_name}</b></Link>
                  <span className="muted small">{f.class_name ? ` · Class ${f.class_name}` : ''} · {new Date(f.created_at).toLocaleString()}</span>
                </span>
              </span>
              <ScoreBadge awarded={f.awarded} marks={f.marks} />
            </header>
            <p className="small muted feedback-q">
              <Link to={`/question/${f.question_id}`}>{f.paper_label} · {f.exam_label} · Q{f.label}</Link> · {f.subtopic}
              {f.assignment_id && <> · <Link to={`/teacher/assignments/${f.assignment_id}`}>assignment</Link></>}
            </p>
            <p className="feedback-text">{f.ai_feedback}</p>
            <details>
              <summary className="small">Student's answer</summary>
              <pre className="past">{f.answer || '(no answer written)'}</pre>
            </details>
            {!f.feedback_seen_at && (
              <button type="button" className="btn small-btn" disabled={busy} onClick={() => markSeen({ ids: [f.id] })}>Mark as read</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
