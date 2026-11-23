import Icon from './Icon.jsx';

// Result of "Check my answer": the mark the AI marker gave, and the mark-scheme points the answer missed,
// so a near miss reads as "5 of 6, add this" rather than as a failure. The scheme below shows every point
// ticked (made) or open (missed).
export default function Verdict({ awarded = 0, marks, criteria = [], ticked = [] }) {
  const full = awarded >= marks;
  const missed = criteria.filter((_, i) => !ticked.includes(i));
  const tone = full ? 'ok' : awarded > 0 ? 'part' : 'none';
  return (
    <div className={`verdict ${tone}`} role="status">
      <p className="verdict-score">
        <b>{awarded}</b><span>/ {marks}</span>
        <span className="verdict-word">{full ? 'Full marks' : awarded > 0 ? 'Nearly there' : 'Not yet'}</span>
      </p>
      {full
        ? <p>Your answer makes every point the examiners look for. Compare your wording with the mark scheme below.</p>
        : missed.length
          ? (
            <div>
              <p><Icon name="arrow" size={16} /> {awarded > 0 ? `To get more marks, also make ${missed.length === 1 ? 'this point' : 'these points'}:` : 'Points the examiners look for:'}</p>
              <ul className="verdict-missed">{missed.slice(0, 4).map((c) => <li key={c.point}>{c.point}</li>)}</ul>
              {missed.length > 4 && <p className="muted small">and {missed.length - 4} more in the mark scheme below.</p>}
            </div>
          )
          : <p>Your answer does not earn full marks yet. Read the mark scheme below and try again.</p>}
    </div>
  );
}

// Result of "Check my answer" while mark schemes are hidden from students: the mark and the AI's hint,
// which points the way without giving the answer. The teacher gets the AI's full feedback.
export function AiResult({ awarded = 0, marks, hint }) {
  const full = awarded >= marks;
  const tone = full ? 'ok' : awarded > 0 ? 'part' : 'none';
  return (
    <div className={`verdict ${tone}`} role="status">
      <p className="verdict-score">
        <b>{awarded}</b><span>/ {marks}</span>
        <span className="verdict-word">{full ? 'Full marks' : awarded > 0 ? 'Nearly there' : 'Not yet'}</span>
      </p>
      {hint && <p className="verdict-hint"><Icon name="target" size={16} /> {hint}</p>}
      {!full && <p className="muted small">Change your answer and check it again. Your teacher can see the AI's full feedback on it.</p>}
    </div>
  );
}
