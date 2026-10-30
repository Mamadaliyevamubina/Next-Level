import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';

// Shown to students until their teacher approves the account. Checks again every 20 seconds.
export default function Pending() {
  const { user, refresh } = useAuth();

  useEffect(() => {
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="pending">
      <div className="card hero-card center-text">
        <span className="icon-tile big"><Icon name="hourglass" size={30} /></span>
        <p className="eyebrow">Almost there</p>
        <h1>Waiting for your teacher</h1>
        <p className="muted">
          Your account has been created. <b>{user.teacher_name || 'Your teacher'}</b> needs to approve it before you can start
          practising. This page opens the practice area by itself once you are approved.
        </p>
        <dl className="facts">
          <div><dt>Login name</dt><dd>@{user.username}</dd></div>
          <div><dt>Subject</dt><dd>{user.subject_name || '—'}</dd></div>
          <div><dt>Teacher</dt><dd>{user.teacher_name || '—'}</dd></div>
          <div><dt>Class</dt><dd>{user.class_name || '—'}</dd></div>
        </dl>
        <div className="row center-row">
          <button type="button" className="btn primary" onClick={refresh}>Check again</button>
          <Link to="/account" className="btn">Fix my details</Link>
        </div>
      </div>
    </div>
  );
}
