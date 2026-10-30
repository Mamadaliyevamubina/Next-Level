import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Meter, { ScoreBadge } from '../components/Meter.jsx';

const STATUSES = [
  ['', 'All'],
  ['new', 'Not tried'],
  ['review', 'Lost marks'],
  ['done', 'Full marks'],
];

export default function Paper() {
  const { paper } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') || '');
  const [reload, setReload] = useState(0);

  const filter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    api('/papers')
      .then((d) => setInfo(d.papers.find((p) => String(p.number) === paper) || null))
      .catch((e) => setError(e.message));
  }, [paper, reload]);

  useEffect(() => {
    setQuestions(null);
    api(`/papers/${paper}/questions?${params.toString()}`)
      .then((d) => setQuestions(d.questions))
      .catch((e) => setError(e.message));
  }, [paper, params, reload]);

  useEffect(() => setSearch(params.get('search') || ''), [params]);

  const practise = async () => {
    const chapter = params.get('chapter');
    const { id } = await api(`/papers/${paper}/next${chapter ? `?chapter=${chapter}` : ''}`);
    if (id) navigate(`/question/${id}`);
  };

  const reset = async () => {
    if (!window.confirm(`Delete all your saved answers for Paper ${paper}? This cannot be undone.`)) return;
    await api(`/progress?paper=${paper}`, { method: 'DELETE' });
    setReload((n) => n + 1);
  };

  if (error) return <p className="error">{error}</p>;
  if (!info) return <p className="muted">Loading…</p>;

  const chapter = params.get('chapter') || '';

  return (
    <div className="split">
      <aside className="rail card">
        <h2>Paper {info.number}</h2>
        <p className="muted small">{info.title}</p>
        <button type="button" className={`rail-item ${chapter ? '' : 'active'}`} onClick={() => filter('chapter', '')}>
          <Meter earned={info.earned} available={info.available} label="All chapters" />
        </button>
        {info.chapters.map((c) => (
          <button
            type="button"
            key={c.number}
            className={`rail-item ${chapter === String(c.number) ? 'active' : ''}`}
            onClick={() => filter('chapter', String(c.number))}
          >
            <Meter earned={c.earned} available={c.available} label={`${c.number}. ${c.name}`} />
            <span className="muted small">{c.attempted} / {c.questions} answered</span>
          </button>
        ))}
        <button type="button" className="link danger small" onClick={reset}>Reset my Paper {info.number} progress</button>
      </aside>

      <section>
        <div className="toolbar">
          <form onSubmit={(e) => { e.preventDefault(); filter('search', search.trim()); }} className="search">
            <input type="search" placeholder="Search questions or topics" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <select value={params.get('exam') || ''} onChange={(e) => filter('exam', e.target.value)}>
            <option value="">All exam sittings</option>
            {info.exams.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
          </select>
          <div className="seg">
            {STATUSES.map(([value, label]) => (
              <button type="button" key={value} className={(params.get('status') || '') === value ? 'on' : ''} onClick={() => filter('status', value)}>
                {label}
              </button>
            ))}
            <button type="button" className={params.get('bookmarked') ? 'on' : ''} onClick={() => filter('bookmarked', params.get('bookmarked') ? '' : '1')}>
              ★ Saved
            </button>
          </div>
          <button type="button" className="primary" onClick={practise}>Practise next</button>
        </div>

        {!questions ? (
          <p className="muted">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="muted card">No questions match these filters.</p>
        ) : (
          <>
            <p className="muted small">{questions.length} questions · {questions.reduce((t, q) => t + q.marks, 0)} marks</p>
            <ul className="qlist">
              {questions.map((q) => (
                <li key={q.id}>
                  <Link to={`/question/${q.id}`} className="card qrow">
                    <div className="row spread">
                      <strong>{q.exam_label} · Q{q.label}</strong>
                      <span className="row">
                        {q.bookmarked && <span title="Saved">★</span>}
                        <span className="muted small">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
                        <ScoreBadge awarded={q.awarded} marks={q.marks} />
                      </span>
                    </div>
                    <span className="tag">{q.subtopic}</span>
                    <p className="preview">{q.preview.replace(/[`*#|]/g, '')}…</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
