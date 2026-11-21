// Percentage bar. Shows "—" when nothing has been answered yet.
export default function Meter({ earned, available, label }) {
  const pct = available ? Math.round((earned / available) * 100) : null;
  const tone = pct === null ? '' : pct >= 70 ? 'ok' : pct >= 40 ? 'warn' : 'bad';
  return (
    <div
      className="meter"
      title={available ? `${earned} / ${available} marks` : 'Not started'}
      role="progressbar"
      aria-label={label || 'Marks earned'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? 0}
      aria-valuetext={available ? `${pct}%, ${earned} of ${available} marks` : 'Not started'}
    >
      {label && <span className="meter-label">{label}</span>}
      <span className="meter-track"><span className={`meter-fill ${tone}`} style={{ width: `${pct ?? 0}%` }} /></span>
      <span className="meter-pct">{pct === null ? '—' : `${pct}%`}</span>
    </div>
  );
}

// The mark for one attempt, the same way whether the student or the AI marker marked it.
export function ScoreBadge({ awarded, marks, markedBy }) {
  if (awarded === null || awarded === undefined) return <span className="badge">new</span>;
  const tone = awarded >= marks ? 'ok' : awarded > 0 ? 'warn' : 'bad';
  const by = markedBy === 'ai' || markedBy === 'auto' ? ' · AI' : '';
  return <span className={`badge ${tone}`}>{awarded}/{marks}{by}</span>;
}
