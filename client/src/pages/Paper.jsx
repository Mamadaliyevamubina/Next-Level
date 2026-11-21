import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { ScoreBadge } from '../components/Meter.jsx';
import Icon from '../components/Icon.jsx';

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
    if (!window.confirm(`Delete all your saved answers for ${info.label}? This cannot be undone.`)) return;
    await api(`/progress?paper=${paper}`, { method: 'DELETE' });
    setReload((n) => n + 1);
  };

  if (error) return <p className="error">{error}</p>;
  if (!info) return <p className="muted">Loading…</p>;

  const chapter = params.get('chapter') || '';
  const current = info.chapters.find((c) => String(c.number) === chapter);
  const activeFilters = ['exam', 'status', 'bookmarked', 'search'].filter((k) => params.get(k)).length;
  const line = /Chem/i.test(info.subject_name || '') ? 'chem' : /Bio/i.test(info.subject_name || '') ? 'bio' : 'cs';
  const stop = (c) => (!c.attempted ? 'open' : c.attempted >= c.questions ? 'done' : 'part');

  return (
    <div className={`paper-page line-${line}`}>
      <header className="paper-head">
        <div className="plate"><span className="plate-code">{info.subject_code || info.number}</span><span>{info.label}</span></div>
        <h1>{current ? `${current.number}. ${current.name}` : info.title}</h1>
        <p className="muted">
          {current
            ? `${current.attempted} of ${current.questions} questions tried in this chapter`
            : `${info.attempted} of ${info.questions} questions tried · ${info.chapters.length} chapters`}
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={practise}>
            {current ? `Practise ${current.name}` : 'Practise next question'} <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>

      <div className="split">
        <nav className="chapter-line" aria-label={`${info.label} chapters`}>
          <button type="button" className={`chapter-stop all ${chapter ? '' : 'active'}`} aria-current={chapter ? undefined : 'true'} onClick={() => filter('chapter', '')}>
            <span className="stop md done" aria-hidden="true" />
            <span><b>All chapters</b><small>{info.attempted} / {info.questions}</small></span>
          </button>
          {info.chapters.map((c) => (
            <button
              type="button"
              key={c.number}
              className={`chapter-stop ${chapter === String(c.number) ? 'active' : ''}`}
              aria-current={chapter === String(c.number) ? 'true' : undefined}
              onClick={() => filter('chapter', String(c.number))}
            >
              <span className={`stop sm ${stop(c)}`} aria-hidden="true" />
              <span><b>{c.number}. {c.name}</b><small>{c.attempted} / {c.questions} tried{c.available ? ` · ${Math.round((c.earned / c.available) * 100)}% of marks` : ''}</small></span>
            </button>
          ))}
          <button type="button" className="link danger small reset" onClick={reset}>Reset my {info.label} progress</button>
        </nav>

        <section className="paper-questions">
          <div className="toolbar">
            <form onSubmit={(e) => { e.preventDefault(); filter('search', search.trim()); }} className="search">
              <input type="search" placeholder="Search questions or topics" aria-label="Search questions or topics" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <details className="filters" open={activeFilters > 0 && !params.get('search') ? true : undefined}>
              <summary className="btn">
                <Icon name="list" size={16} /> Filters{activeFilters > 0 && <span className="count">{activeFilters}</span>}
              </summary>
              <div className="filters-panel">
                <label>
                  Exam sitting
                  <select value={params.get('exam') || ''} onChange={(e) => filter('exam', e.target.value)}>
                    <option value="">All exam sittings</option>
                    {info.exams.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
                  </select>
                </label>
                <div className="seg" role="group" aria-label="Show">
                  {STATUSES.map(([value, label]) => (
                    <button type="button" key={value} aria-pressed={(params.get('status') || '') === value} className={(params.get('status') || '') === value ? 'on' : ''} onClick={() => filter('status', value)}>
                      {label}
                    </button>
                  ))}
                  <button type="button" aria-pressed={!!params.get('bookmarked')} className={params.get('bookmarked') ? 'on' : ''} onClick={() => filter('bookmarked', params.get('bookmarked') ? '' : '1')}>
                    Saved only
                  </button>
                </div>
              </div>
            </details>
          </div>

          {!questions ? (
            <p className="muted">Loading…</p>
          ) : questions.length === 0 ? (
            <div className="card empty">
              <p>No questions match these filters.</p>
              <button type="button" onClick={() => setParams(chapter ? { chapter } : {}, { replace: true })}>Clear filters</button>
            </div>
          ) : (
            <>
              <p className="muted small">{questions.length} questions · {questions.reduce((t, q) => t + q.marks, 0)} marks</p>
              <ul className="qlist">
                {questions.map((q) => (
                  <li key={q.id}>
                    <Link to={`/question/${q.id}`} className="card qrow">
                      <div className="row spread">
                        <strong className="qcode">{q.exam_label} · Q{q.label}</strong>
                        <span className="row">
                          {q.bookmarked && <Icon name="star" size={16} className="saved-icon" />}
                          <span className="muted small">[{q.marks}]</span>
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
    </div>
  );
}
