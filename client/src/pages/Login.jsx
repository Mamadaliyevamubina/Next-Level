import { useState } from 'react';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setFields({ ...fields, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(mode, mode === 'login' ? { email: fields.email, password: fields.password } : fields);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <h1 className="brand">Next Level <small>9618</small></h1>
      <p className="muted">Cambridge AS &amp; A Level Computer Science practice, all four papers, with your progress saved.</p>
      <form className="card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Log in' : 'Create an account'}</h2>
        {mode === 'register' && (
          <label>Name<input value={fields.name} onChange={set('name')} autoComplete="name" required /></label>
        )}
        <label>Email<input type="email" value={fields.email} onChange={set('email')} autoComplete="email" required /></label>
        <label>
          Password
          <input
            type="password"
            value={fields.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : undefined}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <p className="muted small">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  );
}
