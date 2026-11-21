import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import Markdown from '../components/Markdown.jsx';
import { MarksTag } from '../components/Marks.jsx';
import { CODE_TYPES, Figures, isContextFigure } from './Question.jsx';
import { formatDate } from './MyAssignments.jsx';

// Student: a mock exam, sat like the real one. Start → the clock runs → answers save as you type →
// hand in (or time runs out and it is handed in for you) → wait for the teacher → results.
export default function MockExam({ initial, reload }) {
  const { assignment: a } = initial;
  if (a.results_released_at && a.submitted_at) return <MockResults data={initial} />;
  if (a.submitted_at) return <HandedIn data={initial} />;
  if (!a.started_at) return <StartScreen data={initial} reload={reload} />;
  return <Exam data={initial} reload={reload} />;
}

function Head({ a, children }) {
  return (
    <>
      <nav className="crumbs small"><Link to="/assignments">My assignments</Link> <span aria-hidden="true">›</span> <span>{a.title}</span></nav>
      <section className="card hero-card">
        <h1>{a.title}</h1>
        <p className="muted">Mock exam from {a.teacher_name} · {a.time_limit_min} minutes · {a.marks} marks</p>
        {children}
      </section>
    </>
  );
}

function StartScreen({ data, reload }) {
  const { assignment: a, questions } = data;
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const start = async () => {
    if (!window.confirm(`Start the mock exam now? The ${a.time_limit_min}-minute clock starts straight away and cannot be paused.`)) return;
    setStarting(true);
    try {
      await api(`/assignments/${a.id}/start`, { method: 'POST' });
      await reload();
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  };
  return (
    <div className="stack-lg mock">
      <Head a={a}>
        {a.instructions && <Markdown>{a.instructions}</Markdown>}
        <ul className="mock-rules">
          <li><Icon name="clock" size={18} /> <span><b>{a.time_limit_min} minutes</b> for {questions.length} questions ({a.marks} marks). The clock starts when you press Start and cannot be paused.</span></li>
          <li><Icon name="lock" size={18} /> <span><b>Like the real exam:</b> no mark scheme, no AI check and no self-marking while you write.</span></li>
          <li><Icon name="check" size={18} /> <span><b>Your answers save as you type.</b> When time is up they are handed in for you.</span></li>
          <li><Icon name="users" size={18} /> <span><b>Your teacher marks it</b> and you see your results when they release them.</span></li>
        </ul>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" className="btn primary" onClick={start} disabled={starting}>{starting ? 'Starting…' : 'Start the mock exam'} <Icon name="arrow" size={16} /></button>
        </div>
      </Head>
    </div>
  );
}

const fmtClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

function Exam({ data, reload }) {
  const { assignment: a, questions } = data;
  // The server's clock decides; this offset corrects for a wrong clock on the school computer.
  const offset = useRef(new Date(data.server_time).getTime() - Date.now());
  const deadline = new Date(a.deadline).getTime();
  const [now, setNow] = useState(Date.now() + offset.current);
  const [answers, setAnswers] = useState(() => Object.fromEntries(questions.map((q) => [q.id, q.answer || ''])));
  const [status, setStatus] = useState({}); // question id → 'saving' | 'saved' | error text
  const [error, setError] = useState('');
  const [handing, setHanding] = useState(false);
  const timers = useRef({});
  const latest = useRef(answers);
  latest.current = answers;

  const saveOne = useCallback(async (qid) => {
    clearTimeout(timers.current[qid]);
    delete timers.current[qid];
    setStatus((s) => ({ ...s, [qid]: 'saving' }));
    try {
      await api(`/assignments/${a.id}/answers/${qid}`, { method: 'PUT', body: { answer: latest.current[qid] } });
      setStatus((s) => ({ ...s, [qid]: 'saved' }));
    } catch (e) {
      setStatus((s) => ({ ...s, [qid]: e.message }));
    }
  }, [a.id]);

  const flush = () => Promise.all(Object.keys(timers.current).map(saveOne));

  const handIn = useCallback(async (auto = false) => {
    if (!auto) {
      const blank = questions.filter((q) => !latest.current[q.id]?.trim()).length;
      const warn = blank ? `${blank} question${blank === 1 ? ' has' : 's have'} no answer. ` : '';
      if (!window.confirm(`${warn}Hand in the mock exam now? You cannot change your answers afterwards.`)) return;
    }
    setHanding(true);
    try {
      await flush();
      await api(`/assignments/${a.id}/submit`, { method: 'POST' }).catch((e) => { if (!/already handed in/i.test(e.message)) throw e; });
      await reload();
    } catch (e) {
      setError(e.message);
      setHanding(false);
    }
  }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), 500);
    return () => clearInterval(t);
  }, []);

  const left = deadline - now;
  useEffect(() => { if (left <= 0 && !handing) handIn(true); }, [left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the page with unsaved typing: save what we can and warn.
  useEffect(() => {
    const warn = (e) => { if (Object.keys(timers.current).length) { flush(); e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  });

  const change = (qid, text) => {
    setAnswers((s) => ({ ...s, [qid]: text }));
    setStatus((s) => ({ ...s, [qid]: 'typing' }));
    clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(() => saveOne(qid), 1200);
  };

  const done = questions.filter((q) => answers[q.id]?.trim()).length;
  const tone = left <= 60000 ? 'bad' : left <= 5 * 60000 ? 'warn' : '';
  const anySaving = Object.values(status).some((s) => s === 'saving' || s === 'typing');
  const anyError = Object.values(status).find((s) => s && !['saving', 'saved', 'typing'].includes(s));

  return (
    <div className="stack-lg mock">
      <div className={`exam-bar ${tone}`} role="timer" aria-live="off">
        <span className="exam-title">{a.title}</span>
        <span className="exam-clock" aria-label={`Time left ${fmtClock(left)}`}><Icon name="clock" size={18} /> <b>{fmtClock(left)}</b> left</span>
        <span className="exam-done">{done} / {questions.length} answered</span>
        <span className="exam-save muted small">{anyError ? <span className="error-text">Not saved: {anyError}</span> : anySaving ? 'Saving…' : 'All answers saved'}</span>
        <button type="button" className="btn primary sm" onClick={() => handIn(false)} disabled={handing}>{handing ? 'Handing in…' : 'Hand in'}</button>
      </div>
      {tone === 'bad' && <p className="sr-only" role="alert">One minute left.</p>}
      {error && <p className="error">{error}</p>}

      <ol className="plain exam-paper">
        {questions.map((q, i) => {
          const ctx = (q.figures || []).filter(isContextFigure);
          const part = (q.figures || []).filter((f) => !isContextFigure(f));
          const st = status[q.id];
          return (
            <li key={q.id} id={`q${i + 1}`} className="card exam-q">
              <header className="row spread">
                <h2>Question {i + 1}</h2>
                <span className="muted small">{q.exam_label} · Q{q.label}</span>
              </header>
              {ctx.length ? <Figures list={ctx} alt={q.context_note} /> : q.context_note ? <Markdown>{q.context_note}</Markdown> : null}
              {part.length ? <Figures list={part} alt={q.prompt} /> : <Markdown>{q.prompt}</Markdown>}
              <MarksTag marks={q.marks} />
              <label className="answer">
                <span className="row spread small">
                  <span className="muted">Your answer</span>
                  <span className="muted" aria-live="polite">{st === 'saving' ? 'Saving…' : st === 'saved' ? 'Saved' : st === 'typing' ? '' : st || ''}</span>
                </span>
                <textarea
                  className={CODE_TYPES.has(q.answer_type) ? 'mono' : ''}
                  rows={CODE_TYPES.has(q.answer_type) ? 12 : Math.min(12, 3 + q.marks)}
                  value={answers[q.id]}
                  onChange={(e) => change(q.id, e.target.value)}
                  onBlur={() => timers.current[q.id] && saveOne(q.id)}
                  spellCheck={!CODE_TYPES.has(q.answer_type)}
                  disabled={handing || left <= 0}
                />
              </label>
            </li>
          );
        })}
      </ol>
      <div className="row">
        <button type="button" className="btn primary" onClick={() => handIn(false)} disabled={handing}>{handing ? 'Handing in…' : 'Hand in the mock exam'}</button>
        <span className="muted small">{done} of {questions.length} questions answered · {fmtClock(left)} left</span>
      </div>
    </div>
  );
}

function HandedIn({ data }) {
  const { assignment: a, questions } = data;
  return (
    <div className="stack-lg mock">
      <Head a={a}>
        <p className="ok-text"><Icon name="check" size={16} /> Handed in {formatDate(a.submitted_at)}.</p>
        <p className="muted">Your teacher is marking it. Your marks, the mark scheme and your teacher's comments appear here when they release the results.</p>
      </Head>
      <section className="card">
        <details>
          <summary>Your answers ({questions.filter((q) => q.answer?.trim()).length} of {questions.length} answered)</summary>
          <ol className="plain stack" style={{ marginTop: 12 }}>
            {questions.map((q, i) => (
              <li key={q.id}>
                <b>Question {i + 1}</b> <span className="muted small">· {q.exam_label} · Q{q.label} · [{q.marks}]</span>
                <pre className="past">{q.answer?.trim() || '(no answer)'}</pre>
              </li>
            ))}
          </ol>
        </details>
      </section>
    </div>
  );
}

function MockResults({ data }) {
  const { assignment: a, questions, earned } = data;
  const pct = a.marks ? Math.round((earned / a.marks) * 100) : 0;
  return (
    <div className="stack-lg mock">
      <Head a={a}>
        <div className="mock-score">
          <b>{earned}</b><span>/ {a.marks}</span><span className="mock-pct">{pct}%</span>
        </div>
        {a.teacher_comment && (
          <blockquote className="teacher-comment"><Icon name="users" size={16} /> <span><b>{a.teacher_name}:</b> {a.teacher_comment}</span></blockquote>
        )}
      </Head>
      <ol className="plain exam-paper">
        {questions.map((q, i) => {
          const ticked = q.ticked || [];
          const full = (q.mark ?? 0) >= q.marks;
          return (
            <li key={q.id} className="card exam-q">
              <header className="row spread">
                <h2>Question {i + 1} <span className="muted small">· {q.exam_label} · Q{q.label}</span></h2>
                <span className={`badge ${full ? 'ok' : q.mark > 0 ? 'warn' : 'bad'}`}>{q.mark ?? 0} / {q.marks}</span>
              </header>
              <details>
                <summary>Show the question</summary>
                {(q.figures || []).length ? <Figures list={q.figures} alt={q.prompt} /> : <Markdown>{q.prompt}</Markdown>}
              </details>
              <div>
                <span className="muted small">Your answer</span>
                <pre className="past">{q.answer?.trim() || '(no answer)'}</pre>
              </div>
              {q.comment && <p className="teacher-comment"><Icon name="users" size={16} /> <span>{q.comment}</span></p>}
              <div>
                <span className="muted small">Mark scheme: ticked points are the ones you made</span>
                <ul className="plain criteria read-only">
                  {(q.criteria || []).map((c, k) => (
                    <li key={k}>
                      <label className={ticked.includes(k) ? 'met' : 'missed'}>
                        <Icon name={ticked.includes(k) ? 'check' : 'x'} size={16} className={ticked.includes(k) ? 'met-icon' : 'missed-icon'} />
                        <span>{c.point}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
