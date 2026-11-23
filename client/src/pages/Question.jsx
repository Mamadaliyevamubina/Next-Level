import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Markdown from '../components/Markdown.jsx';
import { MarksTag, MarksHint } from '../components/Marks.jsx';
import { ScoreBadge } from '../components/Meter.jsx';
import ExaminerReport from '../components/ExaminerReport.jsx';
import Icon from '../components/Icon.jsx';
import Verdict, { AiResult } from '../components/Verdict.jsx';

export const CODE_TYPES = new Set(['code', 'pseudocode', 'sql', 'trace']);

// Crops of the question's opening text ("stem") or its lettered part are context; the rest show the part itself.
export const isContextFigure = (src) => /-(stem|ctx)-\d+\.jpg$/.test(src);

// Diagrams, tables and flowcharts cropped from the past paper or mark scheme.
export function Figures({ list, alt }) {
  if (!list?.length) return null;
  return (
    <div className="figures">
      {list.map((src) => <img key={src} src={`/${src}`} alt={alt} loading="lazy" />)}
    </div>
  );
}
const draftKey = (id) => `nl-draft-${id}`;

// Metro line colour from the syllabus code at the start of the exam label (0620/42 … → Chemistry).
const lineOfCode = (label = '') => (/^(0620|9701)/.test(label) ? 'chem' : /^9700/.test(label) ? 'bio' : 'cs');

export default function Question() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api(`/questions/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  // key resets the answer box and marking state when moving to another question.
  return <QuestionView key={id} data={data} setData={setData} />;
}

function QuestionView({ data, setData }) {
  const { question: q, prev_id: prevId, next_id: nextId, attempts, examiner, ai_marking: aiMarking } = data;
  const ctxFigs = (q.figures || []).filter(isContextFigure);
  const partFigs = (q.figures || []).filter((f) => !isContextFigure(f));
  const navigate = useNavigate();
  const [answer, setAnswer] = useState(() => localStorage.getItem(draftKey(q.id)) || '');
  // answer → marking → saved (marking it myself), or answer → checked (the AI marker said correct or not).
  const [phase, setPhase] = useState('answer');
  const [correct, setCorrect] = useState(null);
  const [checking, setChecking] = useState(false);
  const [ticked, setTicked] = useState([]);
  const [awarded, setAwarded] = useState(0);
  const [hint, setHint] = useState(null);
  const [touchedScore, setTouchedScore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (answer) localStorage.setItem(draftKey(q.id), answer);
    else localStorage.removeItem(draftKey(q.id));
  }, [answer, q.id]);

  const toggle = (i) => {
    const next = ticked.includes(i) ? ticked.filter((t) => t !== i) : [...ticked, i];
    setTicked(next);
    if (!touchedScore) setAwarded(Math.min(next.length, q.marks));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { attempt } = await api(`/questions/${q.id}/attempts`, { method: 'POST', body: { answer, ticked, awarded } });
      setData({ ...data, attempts: [attempt, ...attempts] });
      localStorage.removeItem(draftKey(q.id));
      setPhase('saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // The AI marker marks the answer against the mark scheme and saves it; it only says whether it is correct.
  const check = async () => {
    setChecking(true);
    setError('');
    try {
      const d = await api(`/questions/${q.id}/check`, { method: 'POST', body: { answer } });
      setData({ ...data, attempts: [d.attempt, ...attempts] });
      localStorage.removeItem(draftKey(q.id));
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

  const toggleBookmark = async () => {
    const d = await api(`/questions/${q.id}/bookmark`, { method: q.bookmarked ? 'DELETE' : 'PUT' });
    setData({ ...data, question: { ...q, bookmarked: d.bookmarked } });
  };

  const practiseNext = async () => {
    const { id } = await api(`/papers/${q.paper}/next?chapter=${q.chapter}`);
    if (id) navigate(`/question/${id}`);
  };

  return (
    <article className={`question${examiner && phase !== 'answer' ? ' wide' : ''}`}>
      <nav className={`crumbs small line-${lineOfCode(q.exam_label)}`} aria-label="Where this question is">
        <Link to={`/paper/${q.paper}`} className="plate"><span className="plate-code">{(q.exam_label || '').split(' ')[0] || q.paper}</span><span>{q.paper_label}</span></Link>
        <Link to={`/paper/${q.paper}?chapter=${q.chapter}`}>{q.chapter_name}</Link>
        <span aria-hidden="true">›</span> <span>{q.subtopic}</span>
      </nav>

      <header className="row spread">
        <h1>{q.exam_label} · Q{q.label}</h1>
        <div className="row">
          <span className="badge">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
          <button type="button" className={`star ${q.bookmarked ? 'on' : ''}`} onClick={toggleBookmark} aria-pressed={!!q.bookmarked} title={q.bookmarked ? 'Remove from saved' : 'Save for later'}>
            <Icon name="star" size={16} /> {q.bookmarked ? 'Saved' : 'Save'}
          </button>
        </div>
      </header>

      {(q.context_note || ctxFigs.length > 0) && (
        <div className="card context">
          {ctxFigs.length ? <Figures list={ctxFigs} alt={q.context_note} /> : <Markdown>{q.context_note}</Markdown>}
        </div>
      )}
      <div className="card">
        {/* An image of the whole part already shows the wording, so show only the image (wording kept as alt text). */}
        {partFigs.length ? <Figures list={partFigs} alt={q.prompt} /> : <Markdown>{q.prompt}</Markdown>}
        <MarksTag marks={q.marks} />
      </div>

      <label className="answer">
        {phase === 'answer' && <MarksHint marks={q.marks} type={q.answer_type} />}
        <span className="muted small">Your answer {phase === 'answer' && '(saved as a draft while you type)'}</span>
        <textarea
          className={CODE_TYPES.has(q.answer_type) ? 'mono' : ''}
          rows={CODE_TYPES.has(q.answer_type) ? 14 : 7}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={phase !== 'answer'}
          spellCheck={!CODE_TYPES.has(q.answer_type)}
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
              {examiner && ' The examiner report for this question opens next to the mark scheme.'}
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
              <button type="button" onClick={retry}>Try again</button>
              <button type="button" className="primary" onClick={practiseNext}>Next question in this chapter</button>
            </div>
          )}
          {phase !== 'checked' && (
            <div className="row">
              <button type="button" onClick={retry}>Answer it again</button>
              <button type="button" className="primary" onClick={practiseNext}>Next question in this chapter</button>
            </div>
          )}
        </section>
      )}

      {phase !== 'answer' && !q.scheme_hidden && (
        <div className={examiner ? 'marking-grid' : undefined}>
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
            <details open={q.answer_figures?.length > 0 && q.criteria.length === 1}>
              <summary>Model answer</summary>
              <Figures list={q.answer_figures} alt="Mark scheme answer" />
              {q.final_answer.startsWith('Answer matches the mark scheme answer shown') ? null : CODE_TYPES.has(q.answer_type) && !q.final_answer.includes('```')
                ? <pre><code>{q.final_answer}</code></pre>
                : <Markdown>{q.final_answer}</Markdown>}
            </details>
          )}

          {phase === 'checked' && (
            <div className="row">
              <button type="button" onClick={retry}>Try again</button>
              <button type="button" className="primary" onClick={practiseNext}>Next question in this chapter</button>
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
              <span className="ok-text">Saved.</span>
              <button type="button" onClick={retry}>Try again</button>
              <button type="button" className="primary" onClick={practiseNext}>Next question in this chapter</button>
            </div>
          )}
        </section>
        <ExaminerReport report={examiner} label={q.label} />
        </div>
      )}

      {attempts.length > 0 && (
        <section className="card">
          <h2>Your previous tries</h2>
          <ul className="plain">
            {attempts.map((a) => (
              <li key={a.id}>
                <details>
                  <summary className="row spread">
                    <span className="muted small">{new Date(a.created_at).toLocaleString()}</span>
                    <ScoreBadge awarded={a.awarded} marks={a.marks} markedBy={a.marked_by} />
                  </summary>
                  <pre className="past">{a.answer || '(no answer written)'}</pre>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="row spread">
        {prevId ? <Link to={`/question/${prevId}`} className="button">← Previous</Link> : <span />}
        {nextId ? <Link to={`/question/${nextId}`} className="button">Next →</Link> : <span />}
      </footer>
    </article>
  );
}
