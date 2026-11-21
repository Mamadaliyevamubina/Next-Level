import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { DMark } from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import SubjectPicker, { GradeSelect, choicesProblem } from '../components/SubjectPicker.jsx';

// Split layout like the school's portal login: big brand mark on one side, form card on the other.
// /login and /signup share this page; ?next=… is kept when switching so the visitor ends up where they wanted.
export default function Login({ mode = 'login' }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const go = (path) => navigate(path + search);
  return (
    <div className="auth-page">
      <section className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          <DMark size={190} className="auth-mark" />
          <div className="auth-chips">
            <span className="chip code">IF score &gt;= 70 THEN</span>
            <span className="chip">2H₂ + O₂ → 2H₂O</span>
            <span className="chip code">01001110 01001100</span>
            <span className="chip">0478 · 0620 · 9618 · 9701 · 9700</span>
          </div>
          <p className="eyebrow light">Dombit International School</p>
          <h2>Next Level for IGCSE and A Level</h2>
          <p>Cambridge past-paper practice for A Level Computer Science (9618), A Level Chemistry (9701), A Level Biology (9700), IGCSE Computer Science (0478) and IGCSE Chemistry (0620), marked against the real mark schemes, with your teacher by your side.</p>
        </div>
      </section>
      <section className="auth-form-side">
        <Link to="/" className="auth-home"><Icon name="home" size={16} /> Home</Link>
        <AuthForms mode={mode} go={go} />
      </section>
    </div>
  );
}

// Shows the first-run setup form while the site has no admin yet; otherwise the login or sign-up form.
function AuthForms({ mode, go }) {
  const [setup, setSetup] = useState(null); // null = checking, true = no admin yet, false = normal
  const [problem, setProblem] = useState('');

  const check = () => {
    setProblem('');
    api('/auth/setup')
      .then((d) => setSetup(d.needsSetup))
      .catch((e) => { setSetup(false); setProblem(e.message); });
  };
  useEffect(check, []);

  if (setup === null) return <p className="muted">Loading…</p>;
  return (
    <>
      {problem && (
        <div className="auth-box" style={{ marginBottom: 16 }}>
          <p className="error">{problem}</p>
          <button type="button" className="link" onClick={check}>Try again</button>
        </div>
      )}
      {setup ? <SetupForm />
        : mode === 'login' ? <LoginForm onSwitch={() => go('/signup')} />
          : <RegisterForm onSwitch={() => go('/login')} />}
    </>
  );
}

// First run: nobody can log in yet, so the person installing the site creates the first super admin here.
function SetupForm() {
  const { signIn } = useAuth();
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await signIn('setup', { name: f.name, username: f.username, email: f.email, password: f.password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Set up Next Level</h1>
      <p className="muted auth-sub">There are no accounts yet. Create the super admin account: it can add admins, teachers and students.</p>
      <form className="auth-card" onSubmit={submit}>
        <label>Full name<input value={f.name} onChange={set('name')} autoComplete="name" autoFocus required /></label>
        <label>
          Login name
          <input value={f.username} onChange={set('username')} placeholder="e.g. mubina" autoComplete="username" pattern="[A-Za-z0-9._\-]{3,30}" title="3–30 letters, numbers, dots, dashes or underscores" required />
        </label>
        <label><span>Email <span className="label-note">(optional)</span></span><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<PasswordInput value={f.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" /></label>
        <label>Confirm password<PasswordInput value={f.confirm} onChange={set('confirm')} placeholder="Type it again" autoComplete="new-password" /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Creating…' : 'Create super admin and log in'}</button>
      </form>
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
      <p className="muted auth-sub">Log in to continue your practice.</p>
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
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', confirm: '', grade: '', class_name: '' });
  const [choices, setChoices] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/auth/options').then(setOptions).catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError('The two passwords do not match.');
    const problem = choicesProblem(f.grade, choices);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      await signIn('register', {
        name: f.name, username: f.username, email: f.email, password: f.password,
        grade: Number(f.grade), class_name: f.class_name, subjects: choices,
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
        <GradeSelect value={f.grade} onChange={(grade) => setF({ ...f, grade })} subjects={options.subjects} choices={choices} onChoices={setChoices} />
        <label>Class<input value={f.class_name} onChange={set('class_name')} placeholder="e.g. 10B or 12A" required /></label>
        <div className="span2">
          <SubjectPicker grade={f.grade} subjects={options.subjects} teachers={options.teachers} value={choices} onChange={setChoices} />
        </div>

        {error && <p className="error span2">{error}</p>}
        <button className="btn primary block span2" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">
        Already have an account? <button type="button" className="link" onClick={onSwitch}>Log in</button>
      </p>
    </div>
  );
}
