import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Markdown from '../components/Markdown.jsx';
import { MarksHint, MarksTag } from '../components/Marks.jsx';
import { ScoreBadge } from '../components/Meter.jsx';
import Verdict from '../components/Verdict.jsx';
import { OPEN_PAPERS, lineOfCode, loadBank } from '../open/banks.js';
import { getDraft, lastAttempt, resetProgress, saveAttempt, setDraft, useProgress } from '../open/progress.js';
import { CODE_TYPES, Figures, isContextFigure } from './Question.jsx';

// Open practice for visitors without an account: every paper's questions from the static banks, marked by
// ticking the mark-scheme points, with progress kept in this browser. Logging in adds AI marking, saved
// progress, assignments and the competition.

const STATUSES = [
  ['', 'All'],
  ['new', 'Not tried'],
  ['review', 'Lost marks'],
  ['done', 'Full marks'],
];

const stopOf = (tried, total) => (!tried ? 'open' : tried >= total ? 'done' : 'part');

function useBank(number) {
  const [bank, setBank] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setBank(null);
    setError('');
    loadBank(number).then((b) => live && setBank(b)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [number]);
  return { bank, error };
}

export default function OpenPaper() {
  const { paper, qid } = useParams();
  const number = Number(paper);
  const info = OPEN_PAPERS[number];
  const { bank, error } = useBank(number);
  const [params, setParams] = useSearchParams();
  useProgress();

  const filter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const chapter = params.get('chapter') || '';
  const list = useMemo(() => {
    if (!bank) return [];
    const words = (params.get('search') || '').toLowerCase().split(/\s+/).filter(Boolean);
    return bank.items.filter((it) => {
      if (chapter && String(it.chapter) !== chapter) return false;
      if (params.get('sub') && it.subtopic !== params.get('sub')) return false;
      if (params.get('exam') && it.exam !== params.get('exam')) return false;
      const last = lastAttempt(it.id);
      const status = params.get('status');
      if (status === 'new' && last) return false;
      if (status === 'review' && !(last && last.awarded < it.marks)) return false;
      if (status === 'done' && !(last && last.awarded >= it.marks)) return false;
      if (words.length) {
        const text = `${it.prompt} ${it.subtopic}`.toLowerCase();
        if (!words.every((w) => text.includes(w))) return false;
      }
      return true;
    });
  }, [bank, params, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!info) return <div className="open-page"><p className="error">No such paper. <Link to="/">See all courses</Link></p></div>;
  if (error) return <div className="open-page"><p className="error">{error}</p></div>;
  if (!bank) return <div className="open-page"><p className="muted">Loading questions…</p></div>;

  if (qid) {
    const it = bank.items.find((x) => x.id === qid);
    if (!it) return <div className="open-page"><p className="error">Question not found. <Link to={`/paper/${number}`}>Back to {info.label}</Link></p></div>;
    const i = list.findIndex((x) => x.id === qid);
    return <OpenQuestion key={qid} it={it} info={info} number={number} prev={i > 0 ? list[i - 1] : null} next={i >= 0 ? list[i + 1] : list[0]} position={i} total={list.length} />;
  }

  const chapters = Object.entries(bank.chapters).map(([n, name]) => {
    const items = bank.items.filter((it) => String(it.chapter) === n);
    return { number: n, name, total: items.length, tried: items.filter((it) => lastAttempt(it.id)).length, items };
  }).filter((c) => c.total > 0);
  const tried = bank.items.filter((it) => lastAttempt(it.id)).length;
  const current = chapters.find((c) => c.number === chapter);
  const subtopics = [...new Set(bank.items.filter((it) => !chapter || String(it.chapter) === chapter).map((it) => it.subtopic))].sort();
  const siblings = Object.entries(OPEN_PAPERS).filter(([, p]) => p.code === info.code);
  const activeFilters = ['sub', 'exam', 'status'].filter((k) => params.get(k)).length;
  const firstNew = list.find((it) => !lastAttempt(it.id)) || list[0];

  return (
    <div className={`open-page paper-page line-${lineOfCode(info.code)}`}>
      {siblings.length > 1 && (
        <nav className="open-tabs" aria-label={`${info.level} ${info.subject} papers`}>
          {siblings.map(([n, p]) => (
            <Link key={n} to={`/paper/${n}`} className={Number(n) === number ? 'on' : ''} aria-current={Number(n) === number ? 'page' : undefined}>
              <b>{p.label.replace(/^.*?(Paper \d+)$/, '$1')}</b><span>{p.title}</span>
            </Link>
          ))}
        </nav>
      )}

      <header className="paper-head">
        <div className="plate"><span className="plate-code">{info.code}</span><span>{info.label}</span></div>
        <h1>{current ? `${current.number}. ${current.name}` : info.title}</h1>
        <p className="muted">
          {current ? `${current.tried} of ${current.total} questions tried in this chapter` : `${tried} of ${bank.items.length} questions tried · ${chapters.length} chapters`}
        </p>
        <div className="row">
          {firstNew && (
            <Link to={`/paper/${number}/q/${firstNew.id}?${params}`} className="btn primary">
              {current ? `Practise ${current.name}` : 'Start practising'} <Icon name="arrow" size={16} />
            </Link>
          )}
          <span className="muted small">Progress is saved in this browser. <Link to="/signup">Create an account</Link> for AI marking and saved progress.</span>
        </div>
      </header>

      <div className="split">
        <nav className="chapter-line" aria-label={`${info.label} chapters`}>
          <button type="button" className={`chapter-stop all ${chapter ? '' : 'active'}`} aria-current={chapter ? undefined : 'true'} onClick={() => { filter('chapter', ''); }}>
            <span className="stop md done" aria-hidden="true" />
            <span><b>All chapters</b><small>{tried} / {bank.items.length}</small></span>
          </button>
          {chapters.map((c) => (
            <button type="button" key={c.number} className={`chapter-stop ${chapter === c.number ? 'active' : ''}`}
              aria-current={chapter === c.number ? 'true' : undefined}
              onClick={() => { const next = new URLSearchParams(params); next.set('chapter', c.number); next.delete('sub'); setParams(next, { replace: true }); }}>
              <span className={`stop sm ${stopOf(c.tried, c.total)}`} aria-hidden="true" />
              <span><b>{c.number}. {c.name}</b><small>{c.tried} / {c.total} tried</small></span>
            </button>
          ))}
          {tried > 0 && (
            <button type="button" className="link danger small reset"
              onClick={() => { if (window.confirm(`Clear your ${info.label} progress in this browser?`)) resetProgress(bank.items.map((it) => it.id)); }}>
              Reset my {info.label} progress
            </button>
          )}
        </nav>

        <section className="paper-questions">
          <div className="toolbar">
            <form className="search" onSubmit={(e) => e.preventDefault()}>
              <input type="search" placeholder="Search questions or topics" aria-label="Search questions or topics"
                value={params.get('search') || ''} onChange={(e) => filter('search', e.target.value)} />
            </form>
            <details className="filters" open={activeFilters > 0 ? true : undefined}>
              <summary className="btn"><Icon name="list" size={16} /> Filters{activeFilters > 0 && <span className="count">{activeFilters}</span>}</summary>
              <div className="filters-panel">
                <label>
                  Subtopic
                  <select value={params.get('sub') || ''} onChange={(e) => filter('sub', e.target.value)}>
                    <option value="">All subtopics</option>
                    {subtopics.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Exam sitting
                  <select value={params.get('exam') || ''} onChange={(e) => filter('exam', e.target.value)}>
                    <option value="">All exam sittings</option>
                    {Object.entries(bank.papers).map(([k, p]) => <option key={k} value={k}>{p.code}</option>)}
                  </select>
                </label>
                <div className="seg" role="group" aria-label="Show">
                  {STATUSES.map(([value, label]) => (
                    <button type="button" key={value} aria-pressed={(params.get('status') || '') === value}
                      className={(params.get('status') || '') === value ? 'on' : ''} onClick={() => filter('status', value)}>{label}</button>
                  ))}
                </div>
              </div>
            </details>
          </div>

          {list.length === 0 ? (
            <div className="card empty">
              <p>No questions match these filters.</p>
              <button type="button" onClick={() => setParams(chapter ? { chapter } : {}, { replace: true })}>Clear filters</button>
            </div>
          ) : (
            <>
              <p className="muted small">{list.length} questions · {list.reduce((t, q) => t + q.marks, 0)} marks</p>
              <ul className="qlist">
                {list.slice(0, 200).map((it) => {
                  const last = lastAttempt(it.id);
                  return (
                    <li key={it.id}>
                      <Link to={`/paper/${number}/q/${it.id}?${params}`} className="card qrow">
                        <div className="row spread">
                          <strong className="qcode">{it.exam_label} · Q{it.q}</strong>
                          <span className="row">
                            <span className="muted small">[{it.marks}]</span>
                            <ScoreBadge awarded={last ? last.awarded : null} marks={it.marks} />
                          </span>
                        </div>
                        <span className="tag">{it.subtopic}</span>
                        <p className="preview">{it.prompt.replace(/[`*#|]/g, '').slice(0, 160)}…</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {list.length > 200 && <p className="muted small">Showing the first 200. Pick a chapter or use the filters to see the rest.</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function OpenQuestion({ it, info, number, prev, next, position, total }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [answer, setAnswer] = useState(() => getDraft(it.id));
  const [phase, setPhase] = useState('answer'); // answer → marking → saved
  const [ticked, setTicked] = useState([]);
  const [awarded, setAwarded] = useState(0);
  const [touched, setTouched] = useState(false);
  const last = lastAttempt(it.id);
  const code = CODE_TYPES.has(it.answer_type);
  const ctxFigs = (it.figures || []).filter(isContextFigure);
  const partFigs = (it.figures || []).filter((f) => !isContextFigure(f));
  const go = (q) => navigate(`/paper/${number}/q/${q.id}?${params}`);

  useEffect(() => { setDraft(it.id, answer); }, [answer, it.id]);

  const toggle = (i) => {
    const nextTicked = ticked.includes(i) ? ticked.filter((t) => t !== i) : [...ticked, i];
    setTicked(nextTicked);
    if (!touched) setAwarded(Math.min(nextTicked.length, it.marks));
  };
  const save = () => { saveAttempt(it.id, awarded, it.marks); setPhase('saved'); };
  const retry = () => { setPhase('answer'); setTicked([]); setAwarded(0); setTouched(false); };

  return (
    <article className={`question open-page line-${lineOfCode(info.code)}`}>
      <nav className="crumbs small" aria-label="Where this question is">
        <Link to={`/paper/${number}`} className="plate"><span className="plate-code">{info.code}</span><span>{info.label}</span></Link>
        <Link to={`/paper/${number}?chapter=${it.chapter}`}>{it.chapter_name}</Link>
        <span aria-hidden="true">›</span> <span>{it.subtopic}</span>
      </nav>

      <header className="row spread">
        <h1>{it.exam_label} · Q{it.q}</h1>
        <div className="row">
          {position >= 0 && <span className="muted small">{position + 1} of {total}</span>}
          <span className="badge">{it.marks} {it.marks === 1 ? 'mark' : 'marks'}</span>
          {last && <ScoreBadge awarded={last.awarded} marks={it.marks} />}
        </div>
      </header>

      {(it.context_note || ctxFigs.length > 0) && (
        <div className="card context">
          {ctxFigs.length ? <Figures list={ctxFigs} alt={it.context_note} /> : <Markdown>{it.context_note}</Markdown>}
        </div>
      )}
      <div className="card">
        {partFigs.length ? <Figures list={partFigs} alt={it.prompt} /> : <Markdown>{it.prompt}</Markdown>}
        <MarksTag marks={it.marks} />
      </div>

      <label className="answer">
        {phase === 'answer' && <MarksHint marks={it.marks} type={it.answer_type} />}
        <span className="muted small">Your answer {phase === 'answer' && '(saved as a draft while you type)'}</span>
        <textarea className={code ? 'mono' : ''} rows={code ? 14 : 7} value={answer} onChange={(e) => setAnswer(e.target.value)}
          readOnly={phase !== 'answer'} spellCheck={!code} />
      </label>

      {phase === 'answer' && (
        <div className="row">
          <button type="button" className="primary" onClick={() => setPhase('marking')}>Mark my answer</button>
          {next && <button type="button" onClick={() => go(next)}>Skip</button>}
          <span className="muted small">You will tick the mark-scheme points your answer makes. <Link to="/login">Log in</Link> to have the AI mark it instead.</span>
        </div>
      )}

      {phase !== 'answer' && (
        <section className="card scheme">
          {phase === 'saved' && <Verdict awarded={awarded} marks={it.marks} criteria={it.criteria} ticked={ticked} />}
          <h2>Mark scheme</h2>
          <p className="muted small">Tick each point your answer clearly makes.{it.max_note && ` ${it.max_note}.`}</p>
          <ul className="plain criteria">
            {it.criteria.map((c, i) => (
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
          {it.rejects?.length > 0 && (
            <div className="rejects small">
              <strong>Examiner notes</strong>
              <ul>{it.rejects.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          {(it.final_answer || it.answer_figures?.length > 0) && (
            <details open={it.answer_figures?.length > 0 && it.criteria.length === 1}>
              <summary>Model answer</summary>
              <Figures list={it.answer_figures} alt="Mark scheme answer" />
              {it.final_answer?.startsWith('Answer matches the mark scheme answer shown') ? null : code && !it.final_answer.includes('```')
                ? <pre><code>{it.final_answer}</code></pre>
                : <Markdown>{it.final_answer || ''}</Markdown>}
            </details>
          )}
          {phase === 'marking' && (
            <div className="score row">
              <span>Your mark</span>
              <button type="button" onClick={() => { setTouched(true); setAwarded(Math.max(0, awarded - 1)); }} disabled={awarded <= 0} aria-label="One mark less">−</button>
              <b>{awarded} / {it.marks}</b>
              <button type="button" onClick={() => { setTouched(true); setAwarded(Math.min(it.marks, awarded + 1)); }} disabled={awarded >= it.marks} aria-label="One mark more">+</button>
              <button type="button" className="primary" onClick={save}>Save mark</button>
            </div>
          )}
          {phase === 'saved' && (
            <div className="row">
              <span className="ok-text">Saved in this browser.</span>
              <button type="button" onClick={retry}>Try again</button>
              {next && <button type="button" className="primary" onClick={() => go(next)}>Next question</button>}
            </div>
          )}
        </section>
      )}

      <div className="row spread open-nav">
        {prev ? <button type="button" onClick={() => go(prev)}><Icon name="arrow" size={16} className="flip" /> Previous</button> : <span />}
        <Link to={`/paper/${number}?${params}`} className="small">All {info.label} questions</Link>
        {next ? <button type="button" onClick={() => go(next)}>Next <Icon name="arrow" size={16} /></button> : <span />}
      </div>
    </article>
  );
}
