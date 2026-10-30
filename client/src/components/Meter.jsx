// Percentage bar. Shows "—" when nothing has been answered yet.
export default function Meter({ earned, available, label }) {
  const pct = available ? Math.round((earned / available) * 100) : null;
  const tone = pct === null ? '' : pct >= 70 ? 'ok' : pct >= 40 ? 'warn' : 'bad';
  return (
    <div className="meter" title={available ? `${earned} / ${available} marks` : 'Not started'}>
      {label && <span className="meter-label">{label}</span>}
      <span className="meter-track"><span className={`meter-fill ${tone}`} style={{ width: `${pct ?? 0}%` }} /></span>
      <span className="meter-pct">{pct === null ? '—' : `${pct}%`}</span>
    </div>
  );
}

export function ScoreBadge({ awarded, marks }) {
  if (awarded === null || awarded === undefined) return <span className="badge">new</span>;
  const tone = awarded >= marks ? 'ok' : awarded > 0 ? 'warn' : 'bad';
  return <span className={`badge ${tone}`}>{awarded}/{marks}</span>;
}
