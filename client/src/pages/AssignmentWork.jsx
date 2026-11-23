import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Markdown from '../components/Markdown.jsx';
import { MarksTag, MarksHint } from '../components/Marks.jsx';
import { ScoreBadge } from '../components/Meter.jsx';
import Icon from '../components/Icon.jsx';
import Verdict, { AiResult } from '../components/Verdict.jsx';
import MockExam from './MockExam.jsx';
import { CODE_TYPES, Figures, isContextFigure } from './Question.jsx';
import { dueStatus, formatDate } from './MyAssignments.jsx';

const draftKey = (assignmentId, questionId) => `nl-draft-a${assignmentId}-${questionId}`;

// Student: answer and self-mark every question of one assignment, then hand it in.
export default function AssignmentWork() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => api(`/assignments/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  if (error && !data) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  // Mock exams have their own timed screen; `key` remounts it when its stage changes.
  if (data.assignment.kind === 'mock') {
    const stage = `${data.assignment.started_at}|${data.assignment.submitted_at}|${data.assignment.results_released_at}`;
    return <MockExam key={stage} initial={data} reload={load} />;
  }

  const { assignment: a, questions } = data;
  const locked = Boolean(a.submitted_at);
  const answered = questions.filter((q) => q.my_attempt).length;
  const earned = questions.reduce((t, q) => t + (q.my_attempt?.awarded || 0), 0);
  const marks = questions.reduce((t, q) => t + q.marks, 0);
  const due = dueStatus(a);
  const q = questions[current];

  const saved = (attempt) => {
    setData({ ...data, questions: questions.map((x, i) => (i === current ? { ...x, my_attempt: attempt } : x)) });
  };

  const submit = async () => {
    const missing = questions.length - answered;
    const warning = missing ? `You have not answered ${missing} question${missing === 1 ? '' : 's'}. ` : '';
    if (!window.confirm(`${warning}Hand in this assignment? You cannot change your answers afterwards.`)) return;
    setSubmitting(true);
    setError('');
    try {
      const d = await api(`/assignments/${id}/submit`, { method: 'POST' });
      setData({ ...data, assignment: { ...a, submitted_at: d.submitted_at } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-lg">
      <nav className="crumbs small"><Link to="/assignments">My assignments</Link> › {a.title}</nav>
      <section className="card">
        <div className="row spread">
          <h1>{a.title}</h1>
          <span className={`badge ${due.tone}`}>{due.text}</span>
        </div>
        <p className="muted small">From {a.teacher_name} · {answered} / {questions.length} answered · {earned} / {marks} marks</p>
        {a.instructions && <Markdown>{a.instructions}</Markdown>}
        {locked
          ? <p className="ok-text">You handed this in on {formatDate(a.submitted_at)}. Ask your teacher if you need to change something.</p>
          : (
            <div className="row">
              <button type="button" className="btn primary" onClick={submit} disabled={submitting}>{submitting ? 'Handing in…' : 'Hand in assignment'}</button>
              <span className="muted small">Answer and mark each question first. After handing in, your answers are locked.</span>
            </div>
          )}
        {error && <p className="error">{error}</p>}
      </section>

      <div className="split">
        <aside className="card">
          <h2>Questions</h2>
          <ul className="plain">
            {questions.map((x, i) => (
              <li key={x.id}>
                <button type="button" className={`rail-item ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)}>
                  <span className="row spread nowrap">
                    <b>{i + 1}. {x.exam_label} · Q{x.label}</b>
                    <ScoreBadge awarded={x.my_attempt?.awarded} marks={x.marks} markedBy={x.my_attempt?.marked_by} />
                  </span>
                  <span className="muted small">{x.paper_label} · {x.subtopic}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {q && (
          <AssignmentQuestion
            key={q.id}
            assignmentId={a.id}
            q={q}
            number={current + 1}
            locked={locked}
            aiMarking={data.ai_marking}
            onSaved={saved}
            onNext={current < questions.length - 1 ? () => setCurrent(current + 1) : null}
          />
        )}
      </div>
    </div>
  );
}

function AssignmentQuestion({ assignmentId, q, number, locked, aiMarking, onSaved, onNext }) {
  const ctxFigs = (q.figures || []).filter(isContextFigure);
  const partFigs = (q.figures || []).filter((f) => !isContextFigure(f));
  const code = CODE_TYPES.has(q.answer_type);
  const previous = q.my_attempt;
  const [answer, setAnswer] = useState(() => localStorage.getItem(draftKey(assignmentId, q.id)) ?? previous?.answer ?? '');
  // answer → marking → saved (marking it myself), or answer → checked (the AI marker said correct or not).
  // Questions already answered (or a handed-in assignment) open on the saved result.
  const aiChecked = previous && (previous.marked_by === 'ai' || previous.marked_by === 'auto');
  const [phase, setPhase] = useState(aiChecked ? 'checked' : previous || locked ? 'saved' : 'answer');
  const [correct, setCorrect] = useState(aiChecked ? previous.awarded >= previous.marks : null);
  const [checking, setChecking] = useState(false);
  const [ticked, setTicked] = useState(previous?.ticked || []);
  const [awarded, setAwarded] = useState(previous?.awarded || 0);
  const [hint, setHint] = useState(previous?.ai_hint || null);
  const [touchedScore, setTouchedScore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (phase !== 'answer') return;
    if (answer) localStorage.setItem(draftKey(assignmentId, q.id), answer);
    else localStorage.removeItem(draftKey(assignmentId, q.id));
  }, [answer, phase, assignmentId, q.id]);

  const toggle = (i) => {
    const next = ticked.includes(i) ? ticked.filter((t) => t !== i) : [...ticked, i];
    setTicked(next);
    if (!touchedScore) setAwarded(Math.min(next.length, q.marks));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { attempt } = await api(`/assignments/${assignmentId}/questions/${q.id}/attempts`, {
        method: 'POST', body: { answer, ticked, awarded },
      });
      localStorage.removeItem(draftKey(assignmentId, q.id));
      onSaved(attempt);
      setPhase('saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setError('');
    try {
      const d = await api(`/assignments/${assignmentId}/questions/${q.id}/check`, { method: 'POST', body: { answer } });
      localStorage.removeItem(draftKey(assignmentId, q.id));
      onSaved(d.attempt);
      setCorrect(d.correct);
      setTicked(d.attempt.ticked || []);
      setAwarded(d.attempt.awarded ?? 0);
      setHint(d.attempt.ai_hint || null);
      setPhase('checked');
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  };

  const retry = () => {
    setPhase('answer');
    setCorrect(null);
    setTicked([]);
    setAwarded(0);
    setHint(null);
    setTouchedScore(false);
  };

  return (
    <article className="question" style={{ margin: 0, maxWidth: 'none' }}>
      <header className="row spread">
        <h2>{number}. {q.exam_label} · Q{q.label}</h2>
        <span className="badge">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
      </header>
      <p className="muted small">{q.paper_label} › {q.chapter_name} › {q.subtopic}</p>

      {(q.context_note || ctxFigs.length > 0) && (
        <div className="card context">
          {ctxFigs.length ? <Figures list={ctxFigs} alt={q.context_note} /> : <Markdown>{q.context_note}</Markdown>}
        </div>
      )}
      <div className="card">
        {partFigs.length ? <Figures list={partFigs} alt={q.prompt} /> : <Markdown>{q.prompt}</Markdown>}
        <MarksTag marks={q.marks} />
      </div>

      <label className="answer">
        {phase === 'answer' && <MarksHint marks={q.marks} type={q.answer_type} />}
        <span className="muted small">Your answer {phase === 'answer' && '(saved as a draft while you type)'}</span>
        <textarea
          className={code ? 'mono' : ''}
          rows={code ? 14 : 7}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={phase !== 'answer'}
          spellCheck={!code}
        />
      </label>

      {phase === 'answer' && (
        <>
          <div className="row">
            {aiMarking && (
              <button type="button" className="primary" onClick={check} disabled={checking || !answer.trim()}>
                {checking ? 'Checking…' : 'Check my answer'}
              </button>
            )}
            {!q.scheme_hidden && (
              <button type="button" className={aiMarking ? undefined : 'primary'} onClick={() => setPhase('marking')} disabled={checking}>
                {aiMarking ? 'Mark it myself' : 'Mark my answer'}
              </button>
            )}
            <span className="muted small">
              {q.scheme_hidden
                ? 'The AI marks your answer and gives you a hint without telling you the answer. Your teacher sees its full feedback.'
                : aiMarking
                  ? 'Check my answer: the AI marker gives you a mark and shows which mark-scheme points you made.'
                  : 'You will tick the mark-scheme points your answer covers.'}
            </span>
          </div>
          {error && <p className="error">{error}</p>}
        </>
      )}

      {phase !== 'answer' && q.scheme_hidden && (
        <section className="card scheme">
          {phase === 'checked' && <AiResult awarded={awarded} marks={q.marks} hint={hint} />}
          {error && <p className="error">{error}</p>}
          {phase === 'checked' && (
            <div className="row">
              {!locked && <button type="button" onClick={retry}>Try again</button>}
              {onNext && <button type="button" className="primary" onClick={onNext}>Next question</button>}
            </div>
          )}
          {phase !== 'checked' && (
            <div className="row">
              {previous ? <span className="ok-text">Saved: {previous.awarded} / {previous.marks}</span> : <span className="muted">Not answered.</span>}
              {!locked && <button type="button" onClick={retry}>{previous ? 'Change my answer' : 'Answer it'}</button>}
              {onNext && <button type="button" className="primary" onClick={onNext}>Next question</button>}
            </div>
          )}
        </section>
      )}

      {phase !== 'answer' && !q.scheme_hidden && (
        <section className="card scheme">
          {phase === 'checked' && <Verdict awarded={awarded} marks={q.marks} criteria={q.criteria} ticked={ticked} />}
          <h2>Mark scheme</h2>
          <p className="muted small">
            {phase === 'checked' ? 'Ticked points are the ones your answer made.' : 'Tick each point your answer clearly makes.'}
            {q.max_note && ` ${q.max_note}.`}
          </p>
          <ul className={`plain criteria${phase === 'checked' ? ' read-only' : ''}`}>
            {q.criteria.map((c, i) => (
              <li key={i}>
                <label className={phase === 'checked' ? (ticked.includes(i) ? 'met' : 'missed') : ticked.includes(i) ? 'checked' : ''}>
                  {phase === 'checked' && <Icon name={ticked.includes(i) ? 'check' : 'x'} size={16} className={ticked.includes(i) ? 'met-icon' : 'missed-icon'} />}
                  {phase !== 'checked' && <input type="checkbox" checked={ticked.includes(i)} onChange={() => toggle(i)} disabled={phase === 'saved'} />}
                  <span>
                    {c.point}
                    {c.key_terms?.length > 0 && <span className="terms">{c.key_terms.map((t) => <code key={t}>{t}</code>)}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {q.rejects.length > 0 && (
            <div className="rejects small">
              <strong>Examiner notes</strong>
              <ul>{q.rejects.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          {(q.final_answer || q.answer_figures?.length > 0) && (
            <details>
              <summary>Model answer</summary>
              <Figures list={q.answer_figures} alt="Mark scheme answer" />
              {q.final_answer.startsWith('Answer matches the mark scheme answer shown') ? null : code && !q.final_answer.includes('```')
                ? <pre><code>{q.final_answer}</code></pre>
                : <Markdown>{q.final_answer}</Markdown>}
            </details>
          )}

          {phase === 'checked' && (
            <div className="row">
              {!locked && <button type="button" onClick={retry}>Try again</button>}
              {onNext && <button type="button" className="primary" onClick={onNext}>Next question</button>}
            </div>
          )}
          {phase !== 'checked' && (
          <div className="score row">
            <span>Your mark</span>
            <button type="button" onClick={() => { setTouchedScore(true); setAwarded(Math.max(0, awarded - 1)); }} disabled={phase === 'saved' || awarded <= 0}>−</button>
            <b>{awarded} / {q.marks}</b>
            <button type="button" onClick={() => { setTouchedScore(true); setAwarded(Math.min(q.marks, awarded + 1)); }} disabled={phase === 'saved' || awarded >= q.marks}>+</button>
            {phase === 'marking' && <button type="button" className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save mark'}</button>}
          </div>
          )}
          {error && <p className="error">{error}</p>}
          {phase === 'saved' && (
            <div className="row">
              {previous ? <span className="ok-text">Saved.</span> : <span className="muted">Not answered.</span>}
              {!locked && <button type="button" onClick={retry}>{previous ? 'Change my answer' : 'Answer it'}</button>}
              {onNext && <button type="button" className="primary" onClick={onNext}>Next question</button>}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
