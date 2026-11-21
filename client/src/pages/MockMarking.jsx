import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import Markdown from '../components/Markdown.jsx';
import { MarksTag } from '../components/Marks.jsx';
import { CODE_TYPES, Figures, isContextFigure } from './Question.jsx';
import { formatDate } from './MyAssignments.jsx';

// Teacher: mark one student's mock exam. Every answer opens with the AI's suggested mark and ticked points;
// the teacher confirms or changes them, adds a comment, and saves. Results stay hidden from the student until
// the teacher releases them on the mock exam's page.
export default function MockMarking() {
  const { id, studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api(`/teacher/assignments/${id}/students/${studentId}/mock`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id, studentId]);

  // While the AI is still marking, look again every few seconds.
  const pending = data?.questions.some((q) => (q.answer || '').trim() && q.ai_mark === null && !q.ai_error);
  useEffect(() => {
    if (!pending) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [pending]);

  const act = async (label, fn) => {
    setBusy(label);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  if (!data) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  const { assignment: a, student, questions } = data;
  const total = questions.reduce((t, q) => t + q.marks, 0);
  const confirmed = questions.filter((q) => q.mark !== null).length;
  const current = questions.reduce((t, q) => t + (q.mark ?? q.ai_mark ?? 0), 0);
  const failed = questions.filter((q) => q.ai_error).length;
  const released = Boolean(a.results_released_at);

  return (
    <div className="stack-lg mock-marking">
      <nav className="crumbs small">
        <Link to="/teacher/assignments">Assignments</Link> <span aria-hidden="true">›</span>
        <Link to={`/teacher/assignments/${a.id}`}>{a.title}</Link> <span aria-hidden="true">›</span> <span>{student.name}</span>
      </nav>

      <section className="card hero-card mark-head">
        <div className="grow">
          <h1>{student.name}</h1>
          <p className="muted">
            {student.class_name ? `Class ${student.class_name} · ` : ''}{a.title} · {a.time_limit_min} minutes
            {student.submitted_at ? ` · handed in ${formatDate(student.submitted_at)}` : ' · not handed in yet'}
          </p>
        </div>
        <div className="mark-total" aria-live="polite">
          <b>{current}</b><span>/ {total}</span>
          <small>{confirmed} of {questions.length} answers confirmed</small>
        </div>
      </section>

      {!student.submitted_at && <p className="notice">The student is still writing. You can mark once they hand in or their time runs out.</p>}
      {released && <p className="notice">Results are already released. Changes you save now are shown to the student straight away.</p>}
      {error && <p className="error">{error}</p>}

      {student.submitted_at && (
        <div className="row">
          {pending && <span className="muted small"><Icon name="hourglass" size={14} /> The AI is suggesting marks…</span>}
          <button type="button" className="btn" disabled={!!busy || confirmed === questions.length}
            onClick={() => act('accept', () => api(`/teacher/assignments/${a.id}/students/${student.id}/accept-ai`, { method: 'POST' }))}>
            {busy === 'accept' ? 'Accepting…' : 'Accept all AI marks I have not changed'}
          </button>
          {failed > 0 && (
            <button type="button" className="btn" disabled={!!busy}
              onClick={() => act('suggest', () => api(`/teacher/assignments/${a.id}/students/${student.id}/suggest`, { method: 'POST' }))}>
              {busy === 'suggest' ? 'Asking the AI…' : `Ask the AI again (${failed})`}
            </button>
          )}
        </div>
      )}

      <ol className="plain mark-list">
        {questions.map((q, i) => (
          <li key={q.id}>
            <MarkQuestion
              n={i + 1}
              q={q}
              disabled={!student.submitted_at}
              onSave={(body) => api(`/teacher/assignments/${a.id}/students/${student.id}/mock/${q.id}`, { method: 'PUT', body }).then(load)}
            />
          </li>
        ))}
      </ol>

      <OverallComment
        initial={student.teacher_comment}
        onSave={(comment) => api(`/teacher/assignments/${a.id}/students/${student.id}/comment`, { method: 'PUT', body: { comment } })}
      />

      <div className="row">
        <Link to={`/teacher/assignments/${a.id}`} className="btn primary"><Icon name="arrow" size={16} /> Back to the mock exam</Link>
      </div>
    </div>
  );
}

function MarkQuestion({ n, q, disabled, onSave }) {
  const teacherMarked = q.mark !== null;
  const [ticked, setTicked] = useState(teacherMarked ? q.ticked : q.ai_ticked || []);
  const [mark, setMark] = useState(q.mark ?? q.ai_mark ?? 0);
  const [comment, setComment] = useState(q.comment || '');
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState(''); // '', 'saving', 'saved', or an error message

  // The AI's suggestion arrives after the page opened: show it unless the teacher has already started.
  useEffect(() => {
    if (!teacherMarked && !touched && q.ai_mark !== null) {
      setTicked(q.ai_ticked || []);
      setMark(q.ai_mark);
    }
  }, [q.ai_mark]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (i) => {
    const next = ticked.includes(i) ? ticked.filter((t) => t !== i) : [...ticked, i];
    setTicked(next);
    setMark(Math.min(next.length, q.marks));
    setTouched(true);
  };
  const step = (d) => { setMark(Math.max(0, Math.min(q.marks, mark + d))); setTouched(true); };

  const save = async () => {
    setState('saving');
    try {
      await onSave({ mark, ticked, comment });
      setState('saved');
      setTouched(false);
    } catch (e) {
      setState(e.message);
    }
  };

  const ctxFigs = (q.figures || []).filter(isContextFigure);
  const partFigs = (q.figures || []).filter((f) => !isContextFigure(f));
  const answer = (q.answer || '').trim();
  const source = teacherMarked ? 'Your mark' : q.ai_mark !== null ? 'AI suggestion' : q.ai_error ? 'AI could not mark this' : answer ? 'Waiting for the AI' : 'No answer';

  return (
    <article className={`card mark-q ${teacherMarked && !touched ? 'is-marked' : ''}`}>
      <header className="row spread">
        <h2>Question {n} <span className="muted small">· {q.exam_label} · Q{q.label}</span></h2>
        <span className={`badge ${teacherMarked && !touched ? 'ok' : q.ai_error ? 'bad' : ''}`}>{touched ? 'Not saved' : source}</span>
      </header>

      <details className="mark-prompt">
        <summary>Show the question</summary>
        {ctxFigs.length ? <Figures list={ctxFigs} alt={q.context_note} /> : q.context_note ? <Markdown>{q.context_note}</Markdown> : null}
        {partFigs.length ? <Figures list={partFigs} alt={q.prompt} /> : <Markdown>{q.prompt}</Markdown>}
        <MarksTag marks={q.marks} />
      </details>

      <div className="mark-cols">
        <section>
          <h3>Student's answer</h3>
          {answer ? <pre className={`past ${CODE_TYPES.has(q.answer_type) ? 'mono' : ''}`}>{q.answer}</pre> : <p className="muted">No answer written.</p>}
          {q.ai_error && <p className="error small">{q.ai_error}</p>}
        </section>
        <section>
          <h3>Mark scheme</h3>
          {q.max_note && <p className="muted small">{q.max_note}.</p>}
          <ul className="plain criteria">
            {q.criteria.map((c, i) => (
              <li key={i}>
                <label className={ticked.includes(i) ? 'checked' : ''}>
                  <input type="checkbox" checked={ticked.includes(i)} onChange={() => toggle(i)} disabled={disabled} />
                  <span>{c.point}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mark-foot">
        <div className="score row" role="group" aria-label={`Mark for question ${n}`}>
          <span>Mark</span>
          <button type="button" onClick={() => step(-1)} disabled={disabled || mark <= 0} aria-label="One mark less">−</button>
          <b>{mark} / {q.marks}</b>
          <button type="button" onClick={() => step(1)} disabled={disabled || mark >= q.marks} aria-label="One mark more">+</button>
        </div>
        <label className="grow">
          <span className="visually-hidden">Comment for the student</span>
          <input value={comment} onChange={(e) => { setComment(e.target.value); setTouched(true); }} placeholder="Comment for the student (optional)" disabled={disabled} />
        </label>
        <button type="button" className={`btn ${touched || !teacherMarked ? 'primary' : ''}`} onClick={save} disabled={disabled || state === 'saving'}>
          {state === 'saving' ? 'Saving…' : teacherMarked && !touched ? 'Saved' : 'Save mark'}
        </button>
      </div>
      {state && !['saving', 'saved'].includes(state) && <p className="error small">{state}</p>}
    </article>
  );
}

function OverallComment({ initial, onSave }) {
  const [text, setText] = useState(initial || '');
  const [state, setState] = useState('');
  return (
    <section className="card stack">
      <h2>Overall comment</h2>
      <textarea rows={3} value={text} onChange={(e) => { setText(e.target.value); setState(''); }}
        placeholder="What went well and what to work on next. The student sees this with their results." />
      <div className="row">
        <button type="button" className="btn" onClick={async () => { setState('saving'); try { await onSave(text); setState('saved'); } catch (e) { setState(e.message); } }}>
          {state === 'saving' ? 'Saving…' : 'Save comment'}
        </button>
        {state === 'saved' && <span className="ok-text">Saved.</span>}
        {state && !['saving', 'saved'].includes(state) && <span className="error small">{state}</span>}
      </div>
    </section>
  );
}
