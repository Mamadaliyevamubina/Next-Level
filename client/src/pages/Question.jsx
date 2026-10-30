import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Markdown from '../components/Markdown.jsx';
import { ScoreBadge } from '../components/Meter.jsx';

const CODE_TYPES = new Set(['code', 'pseudocode', 'sql', 'trace']);
const draftKey = (id) => `nl-draft-${id}`;

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
  const { question: q, prev_id: prevId, next_id: nextId, attempts } = data;
  const navigate = useNavigate();
  const [answer, setAnswer] = useState(() => localStorage.getItem(draftKey(q.id)) || '');
  const [phase, setPhase] = useState('answer'); // answer → marking → saved
  const [ticked, setTicked] = useState([]);
  const [awarded, setAwarded] = useState(0);
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

  const retry = () => {
    setPhase('answer');
    setTicked([]);
    setAwarded(0);
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
    <article className="question">
      <nav className="crumbs small">
        <Link to={`/paper/${q.paper}`}>Paper {q.paper}</Link> ›{' '}
        <Link to={`/paper/${q.paper}?chapter=${q.chapter}`}>{q.chapter_name}</Link> › {q.subtopic}
      </nav>

      <header className="row spread">
        <h1>{q.exam_label} · Q{q.label}</h1>
        <div className="row">
          <span className="badge">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
          <button type="button" className={`star ${q.bookmarked ? 'on' : ''}`} onClick={toggleBookmark} title={q.bookmarked ? 'Remove from saved' : 'Save for later'}>
            {q.bookmarked ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </header>

      {q.context_note && <div className="card context"><Markdown>{q.context_note}</Markdown></div>}
      <div className="card"><Markdown>{q.prompt}</Markdown></div>

      <label className="answer">
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
        <div className="row">
          <button type="button" className="primary" onClick={() => setPhase('marking')}>Mark my answer</button>
          <span className="muted small">You will tick the mark-scheme points your answer covers.</span>
        </div>
      )}

      {phase !== 'answer' && (
        <section className="card scheme">
          <h2>Mark scheme</h2>
          <p className="muted small">Tick each point your answer clearly makes.{q.max_note && ` ${q.max_note}.`}</p>
          <ul className="plain criteria">
            {q.criteria.map((c, i) => (
              <li key={i}>
                <label className={ticked.includes(i) ? 'checked' : ''}>
                  <input type="checkbox" checked={ticked.includes(i)} onChange={() => toggle(i)} disabled={phase === 'saved'} />
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
          {q.final_answer && (
            <details>
              <summary>Model answer</summary>
              {CODE_TYPES.has(q.answer_type) && !q.final_answer.includes('```')
                ? <pre><code>{q.final_answer}</code></pre>
                : <Markdown>{q.final_answer}</Markdown>}
            </details>
          )}

          <div className="score row">
            <span>Your mark</span>
            <button type="button" onClick={() => { setTouchedScore(true); setAwarded(Math.max(0, awarded - 1)); }} disabled={phase === 'saved' || awarded <= 0}>−</button>
            <b>{awarded} / {q.marks}</b>
            <button type="button" onClick={() => { setTouchedScore(true); setAwarded(Math.min(q.marks, awarded + 1)); }} disabled={phase === 'saved' || awarded >= q.marks}>+</button>
            {phase === 'marking' && <button type="button" className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save mark'}</button>}
          </div>
          {error && <p className="error">{error}</p>}
          {phase === 'saved' && (
            <div className="row">
              <span className="ok-text">Saved.</span>
              <button type="button" onClick={retry}>Try again</button>
              <button type="button" className="primary" onClick={practiseNext}>Next question in this chapter</button>
            </div>
          )}
        </section>
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
                    <ScoreBadge awarded={a.awarded} marks={a.marks} />
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
