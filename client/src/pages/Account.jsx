import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import SubjectPicker, { GradeSelect, choicesOf, choicesProblem } from '../components/SubjectPicker.jsx';
import { initials, roleLabel } from '../components/Layout.jsx';
import { usePapers } from '../papers.js';

const ACCENTS = [
  ['purple', 'Dombit purple', '#8e00d5'],
  ['blue', 'Ocean blue', '#2563eb'],
  ['teal', 'Teal', '#0d9488'],
  ['rose', 'Rose', '#e11d48'],
  ['amber', 'Amber', '#d97706'],
];

export default function Account() {
  const { user } = useAuth();
  const tabs = [
    ['profile', 'Profile', 'user'],
    ...(user.role === 'student' ? [['class', 'My class', 'school']] : []),
    ['appearance', 'Appearance', 'palette'],
    ['study', 'Study', 'target'],
    ['security', 'Security', 'shield'],
  ];
  const [tab, setTab] = useState('profile');

  return (
    <div className="account">
      <section className="card account-head">
        <span className="avatar xl">{initials(user.name)}</span>
        <div>
          <h1>{user.name}</h1>
          <p className="muted">@{user.username} · {roleLabel(user)}{user.teacher_name ? ` · Teacher: ${user.teacher_name}` : ''}</p>
        </div>
        <span className={`status-pill ${user.status}`}>{user.status}</span>
      </section>

      <div className="account-body">
        <nav className="card account-tabs">
          {tabs.map(([key, label, icon]) => (
            <button type="button" key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              <Icon name={icon} /> {label}
            </button>
          ))}
        </nav>
        <section className="card account-panel">
          {tab === 'profile' && <Profile />}
          {tab === 'class' && <ClassDetails />}
          {tab === 'appearance' && <Appearance />}
          {tab === 'study' && <Study />}
          {tab === 'security' && <Security />}
        </section>
      </div>
    </div>
  );
}

function useSaver() {
  const [state, setState] = useState({ busy: false, error: '', ok: '' });
  const run = async (fn, okText = 'Saved.') => {
    setState({ busy: true, error: '', ok: '' });
    try {
      const msg = await fn();
      setState({ busy: false, error: '', ok: msg || okText });
    } catch (e) {
      setState({ busy: false, error: e.message, ok: '' });
    }
  };
  const note = (state.error && <p className="error">{state.error}</p>) || (state.ok && <p className="ok-text">{state.ok}</p>);
  return [state, run, note];
}

function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, username: user.username, email: user.email || '' });
  const [state, run, note] = useSaver();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api('/account/profile', { method: 'PATCH', body: f });
      setUser(d.user);
    });
  };

  return (
    <form onSubmit={save} className="stack">
      <h2>Profile</h2>
      <p className="muted small">Your login name is what you type to sign in. Teachers see your full name.</p>
      <label>Full name<input value={f.name} onChange={set('name')} required /></label>
      <label>Login name<input value={f.username} onChange={set('username')} pattern="[A-Za-z0-9._\-]{3,30}" title="3–30 letters, numbers, dots, dashes or underscores" required /></label>
      <label><span>Email <span className="label-note">(optional, you can also log in with it)</span></span><input type="email" value={f.email} onChange={set('email')} /></label>
      <p className="muted small">Member since {new Date(user.created_at).toLocaleDateString()}</p>
      {note}
      <div><button className="btn primary" disabled={state.busy}>Save profile</button></div>
    </form>
  );
}

function ClassDetails() {
  const { user, setUser } = useAuth();
  const [options, setOptions] = useState({ subjects: [], teachers: [] });
  const [f, setF] = useState({ grade: String(user.grade || ''), class_name: user.class_name });
  const [choices, setChoices] = useState(() => choicesOf(user));
  const [state, run, note] = useSaver();

  useEffect(() => { api('/auth/options').then(setOptions).catch(() => {}); }, []);

  // A subject/teacher pair the student did not have before needs that teacher's approval.
  const before = new Set(choicesOf(user).map((c) => `${c.subject_id}:${c.teacher_id}`));
  const addsTeacher = choices.some((c) => c.teacher_id && !before.has(`${c.subject_id}:${c.teacher_id}`));

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      const problem = choicesProblem(f.grade, choices);
      if (problem) throw new Error(problem);
      const d = await api('/account/profile', {
        method: 'PATCH',
        body: { grade: Number(f.grade), class_name: f.class_name, subjects: choices },
      });
      setUser(d.user);
      setChoices(choicesOf(d.user));
      return d.needsApproval ? 'Saved. Your new teacher needs to approve you before you can continue.' : 'Saved.';
    });
  };

  return (
    <form onSubmit={save} className="stack">
      <h2>My class</h2>
      <p className="muted small">Each teacher sees your progress in the subject they teach you.</p>
      <GradeSelect value={f.grade} onChange={(grade) => setF({ ...f, grade })} subjects={options.subjects} choices={choices} onChoices={setChoices} />
      <label>Class<input value={f.class_name} onChange={(e) => setF({ ...f, class_name: e.target.value })} required /></label>
      <SubjectPicker grade={f.grade} subjects={options.subjects} teachers={options.teachers} value={choices} onChange={setChoices} />
      {addsTeacher && (
        <p className="notice small"><Icon name="hourglass" /> Adding a subject or changing a teacher sends your account back for approval.</p>
      )}
      {note}
      <div><button className="btn primary" disabled={state.busy}>Save class details</button></div>
    </form>
  );
}

function useSetting() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const update = async (patch) => {
    setUser({ ...user, settings: { ...user.settings, ...patch } });
    try {
      const d = await api('/account/settings', { method: 'PATCH', body: { settings: patch } });
      setUser(d.user);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };
  return [user.settings, update, error];
}

function Choice({ label, value, options, onChange }) {
  return (
    <div className="setting">
      <span>{label}</span>
      <div className="seg">
        {options.map(([v, text]) => (
          <button type="button" key={String(v)} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="setting toggle">
      <span>{label}{hint && <small className="muted"> {hint}</small>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Appearance() {
  const [s, update, error] = useSetting();
  return (
    <div className="stack">
      <h2>Appearance</h2>
      <p className="muted small">Changes apply straight away and follow you to any device you log in on.</p>
      <Choice label="Theme" value={s.theme} onChange={(theme) => update({ theme })} options={[['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']]} />
      <div className="setting">
        <span>Accent colour</span>
        <div className="swatches">
          {ACCENTS.map(([key, name, hex]) => (
            <button type="button" key={key} title={name} aria-label={name} className={`swatch ${s.accent === key ? 'on' : ''}`} style={{ background: hex }} onClick={() => update({ accent: key })}>
              {s.accent === key && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      </div>
      <Choice label="Text size" value={s.fontSize} onChange={(fontSize) => update({ fontSize })} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
      <Choice label="Font" value={s.font} onChange={(font) => update({ font })} options={[['inter', 'Inter (school)'], ['readable', 'Extra readable']]} />
      <Toggle label="Compact layout" hint="less spacing, more on screen" checked={s.compact} onChange={(compact) => update({ compact })} />
      <Toggle label="Reduce motion" hint="turn off animations" checked={s.reduceMotion} onChange={(reduceMotion) => update({ reduceMotion })} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function Study() {
  const [s, update, error] = useSetting();
  const papers = usePapers() || [];
  return (
    <div className="stack">
      <h2>Study preferences</h2>
      <div className="setting">
        <span>Daily goal <small className="muted">questions per day</small></span>
        <div className="row">
          <input type="range" min="1" max="50" value={s.dailyGoal} onChange={(e) => update({ dailyGoal: Number(e.target.value) })} />
          <b className="goal-num">{s.dailyGoal}</b>
        </div>
      </div>
      <Choice
        label="Main paper on the home page"
        value={s.defaultPaper}
        onChange={(defaultPaper) => update({ defaultPaper })}
        options={[[null, 'None'], ...papers.map((p) => [p.number, p.label])]}
      />
      <Toggle label="Show practice streak" checked={s.showStreak} onChange={(showStreak) => update({ showStreak })} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function Security() {
  const { user, logout } = useAuth();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [state, run, note] = useSaver();
  const [del, setDel] = useState('');
  const [delState, runDel, delNote] = useSaver();

  const changePassword = (e) => {
    e.preventDefault();
    run(async () => {
      if (pw.next !== pw.confirm) throw new Error('The new passwords do not match.');
      await api('/account/password', { method: 'POST', body: { current: pw.current, next: pw.next } });
      setPw({ current: '', next: '', confirm: '' });
    }, 'Password changed.');
  };

  const remove = (e) => {
    e.preventDefault();
    if (!window.confirm('Delete your account and every answer you have saved? This cannot be undone.')) return;
    runDel(async () => {
      await api('/account', { method: 'DELETE', body: { password: del } });
      logout();
    });
  };

  return (
    <div className="stack">
      <form onSubmit={changePassword} className="stack">
        <h2>Change password</h2>
        <label>Current password<input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required /></label>
        <label>New password<input type="password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" required /></label>
        <label>Confirm new password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required /></label>
        {note}
        <div><button className="btn primary" disabled={state.busy}>Change password</button></div>
      </form>

      {user.role === 'student' && (
        <form onSubmit={remove} className="stack danger-zone">
          <h2><Icon name="trash" /> Delete account</h2>
          <p className="muted small">Removes your account, answers and saved questions for good.</p>
          <label>Type your password to confirm<input type="password" value={del} onChange={(e) => setDel(e.target.value)} required /></label>
          {delNote}
          <div><button className="btn danger" disabled={delState.busy}>Delete my account</button></div>
        </form>
      )}
    </div>
  );
}
