import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ScoreBadge } from '../components/Meter.jsx';

export default function Bookmarks() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/bookmarks').then((d) => setItems(d.bookmarks)).catch((e) => setError(e.message));
  }, []);

  const remove = async (id) => {
    await api(`/questions/${id}/bookmark`, { method: 'DELETE' });
    setItems(items.filter((b) => b.id !== id));
  };

  if (error) return <p className="error">{error}</p>;
  if (!items) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>Saved questions</h1>
      {items.length === 0 ? (
        <p className="muted card">Press ☆ Save on any question to keep it here for revision.</p>
      ) : (
        <ul className="qlist">
          {items.map((b) => (
            <li key={b.id} className="card qrow">
              <div className="row spread">
                <Link to={`/question/${b.id}`}><strong>{b.paper_label} · {b.exam_label} · Q{b.label}</strong></Link>
                <span className="row">
                  <ScoreBadge awarded={b.awarded} marks={b.marks} />
                  <button type="button" className="link small" onClick={() => remove(b.id)}>Remove</button>
                </span>
              </div>
              <span className="tag">{b.subtopic}</span>
              <p className="preview">{b.preview.replace(/[`*#|]/g, '')}…</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
