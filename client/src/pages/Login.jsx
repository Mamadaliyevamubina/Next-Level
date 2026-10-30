import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { DMark } from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';

// Split layout like the school's portal login: big brand mark on one side, form card on the other,
// with an A Level Computer Science twist on the brand panel.
export default function Login() {
  const [mode, setMode] = useState('login');
  return (
    <div className="auth-page">
      <section className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          <DMark size={190} className="auth-mark" />
          <div className="auth-chips">
            <span className="chip code">IF score &gt;= 70 THEN</span>
            <span className="chip code">01001110 01001100</span>
            <span className="chip code">SELECT * FROM Student</span>
            <span className="chip">Paper 1 · 2 · 3 · 4</span>
          </div>
          <p className="eyebrow light">Dombit International School</p>
          <h2>Next Level for A Level</h2>
          <p>Cambridge AS &amp; A Level Computer Science (9618) practice, marked against real mark schemes, with your teacher by your side.</p>
        </div>
      </section>
      <section className="auth-form-side">
        {mode === 'login' ? <LoginForm onSwitch={() => setMode('register')} /> : <RegisterForm onSwitch={() => setMode('login')} />}
      </section>
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <span className="input-wrap">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} required />
      <button type="button" className="input-icon" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </span>
  );
}

function LoginForm({ onSwitch }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn('login', { username, password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-box">
      <DMark size={44} className="auth-mark-small" />
      <h1 className="auth-title">Welcome back!</h1>
      <p className="muted auth-sub">Log in to continue your A Level practice.</p>
      <form className="auth-card" onSubmit={submit}>
        <label>
          Login name
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your login name" autoComplete="username" autoFocus required />
        </label>
        <label>
          Password
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">
        New student? <button type="button" className="link" onClick={onSwitch}>Create your account</button>
      </p>
    </div>
  );
}

function RegisterForm({ onSwitch }) {
  const { signIn } = useAuth();
  const [options, setOptions] = useState({ subjects: [], teachers: [] });
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', confirm: '', subject_id: '', teacher_id: '', class_name: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/auth/options')
      .then((d) => {
        setOptions(d);
        if (d.subjects.length === 1) setF((cur) => ({ ...cur, subject_id: String(d.subjects[0].id) }));
      })
      .catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === 'subject_id' ? { teacher_id: '' } : {}) });
  const teachers = options.teachers.filter((t) => t.subject_ids.includes(Number(f.subject_id)));

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await signIn('register', {
        name: f.name, username: f.username, email: f.email, password: f.password,
        subject_id: Number(f.subject_id), teacher_id: Number(f.teacher_id), class_name: f.class_name,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-box wide">
      <h1 className="auth-title">Join your class</h1>
      <p className="muted auth-sub">Create your account. Your teacher approves it before you can start.</p>
      <form className="auth-card grid-form" onSubmit={submit}>
        <label className="span2">Full name<input value={f.name} onChange={set('name')} placeholder="e.g. Mubina Mamadaliyeva" autoComplete="name" required /></label>
        <label>
          Login name
          <input value={f.username} onChange={set('username')} placeholder="e.g. mubina.m" autoComplete="username" pattern="[A-Za-z0-9._\-]{3,30}" title="3–30 letters, numbers, dots, dashes or underscores" required />
        </label>
        <label><span>Email <span className="label-note">(optional)</span></span><input type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></label>
        <label>Password<PasswordInput value={f.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" /></label>
        <label>Confirm password<PasswordInput value={f.confirm} onChange={set('confirm')} placeholder="Type it again" autoComplete="new-password" /></label>

        <p className="span2 form-section"><Icon name="school" /> Your class</p>
        <label>
          Subject
          <select value={f.subject_id} onChange={set('subject_id')} required>
            <option value="">Choose a subject</option>
            {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>
          Teacher
          <select value={f.teacher_id} onChange={set('teacher_id')} required disabled={!f.subject_id}>
            <option value="">{f.subject_id && !teachers.length ? 'No teachers for this subject yet' : 'Choose your teacher'}</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="span2">Class<input value={f.class_name} onChange={set('class_name')} placeholder="e.g. AS-1 or 12A" required /></label>

        {error && <p className="error span2">{error}</p>}
        <button className="btn primary block span2" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">
        Already have an account? <button type="button" className="link" onClick={onSwitch}>Log in</button>
      </p>
    </div>
  );
}
