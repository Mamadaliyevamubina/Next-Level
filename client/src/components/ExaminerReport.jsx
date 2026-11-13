import Icon from './Icon.jsx';

// Turns report text into paragraphs; lines starting with "•" become a bullet list.
function ReportText({ text }) {
  if (!text) return null;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => l.startsWith('•'));
  const paras = lines.filter((l) => !l.startsWith('•'));
  return (
    <>
      {paras.map((p, i) => <p key={`p${i}`}>{p}</p>)}
      {bullets.length > 0 && <ul>{bullets.map((b, i) => <li key={`b${i}`}>{b.replace(/^•\s*/, '')}</li>)}</ul>}
    </>
  );
}

// What the Cambridge examiners wrote about this question part (and the whole paper) in the Principal Examiner Report.
// report: { title, key_messages, general, url, comments: [{ label, comment }] } — most specific comment first.
export default function ExaminerReport({ report, label }) {
  if (!report) return null;
  const [main, ...parents] = report.comments || [];
  const exact = main && main.label === label;
  return (
    <aside className="card examiner" aria-label="Examiner report">
      <h2><Icon name="book" /> Examiner report</h2>
      {main ? (
        <div className="examiner-comment">
          <p className="examiner-label">{exact ? `On Question ${label}` : `On Question ${main.label}`}</p>
          <ReportText text={main.comment} />
        </div>
      ) : (
        <p className="muted small">The examiners did not comment on this question separately. Their advice on the whole paper is below.</p>
      )}
      {exact && parents.map((p) => (
        <details key={p.label} className="examiner-more">
          <summary>About Question {p.label} as a whole</summary>
          <ReportText text={p.comment} />
        </details>
      ))}
      {report.key_messages && (
        <details className="examiner-more" open={!main}>
          <summary>Key messages for this paper</summary>
          <ReportText text={report.key_messages} />
        </details>
      )}
      {report.general && (
        <details className="examiner-more">
          <summary>General comments</summary>
          <ReportText text={report.general} />
        </details>
      )}
      {report.url && (
        <a className="small" href={report.url} target="_blank" rel="noopener noreferrer">
          Full examiner report{report.title ? ` · ${report.title}` : ''} (PDF)
        </a>
      )}
    </aside>
  );
}
