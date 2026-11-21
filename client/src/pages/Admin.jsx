import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { initials } from '../components/Layout.jsx';
import SubjectPicker, { GradeSelect, choicesOf, choicesProblem } from '../components/SubjectPicker.jsx';
import { Stat, timeAgo } from './Teacher.jsx';

const ROLE_LABELS = { student: 'Student', teacher: 'Teacher', admin: 'Admin', super_admin: 'Super admin' };
const STATUS_LABELS = { approved: 'Active', pending: 'Pending', rejected: 'Blocked' };

// Admins and super admins: every account in the school.
// Admins manage teachers and students; only super admins can manage admins or delete accounts.
export default function Admin() {
  const { user } = useAuth();
  const superAdmin = user.role === 'super_admin';
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [manageable, setManageable] = useState([]);
  const [options, setOptions] = useState({ subjects: [], teachers: [] });
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    try {
      const [o, u, opts] = await Promise.all([api('/admin/overview'), api(`/admin/users?${params}`), api('/auth/options')]);
      setOverview(o);
      setUsers(u.users);
      setManageable(u.manageable_roles);
      setOptions(opts);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [role, status, search]);

  const run = async (fn, message) => {
    setError('');
    setNotice('');
    try {
      await fn();
      if (message) setNotice(message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const setUserStatus = (u, next) => run(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { status: next } }));
  const changeRole = (u, next) => {
    if (next === u.role) return;
    if (!window.confirm(`Make ${u.name} ${ROLE_LABELS[next].toLowerCase()}?`)) return;
    run(() => api(`/admin/users/${u.id}/role`, { method: 'POST', body: { role: next } }), `${u.name} is now ${ROLE_LABELS[next].toLowerCase()}.`);
  };
  const resetPassword = (u) => {
    const password = window.prompt(`New password for ${u.name} (at least 8 characters):`);
    if (password) run(() => api(`/admin/users/${u.id}/password`, { method: 'POST', body: { password } }), `Password changed for ${u.name}.`);
  };
  const remove = (u) => {
    if (!window.confirm(`Delete ${u.name} (@${u.username}) permanently, with all their answers? This cannot be undone.`)) return;
    run(() => api(`/admin/users/${u.id}`, { method: 'DELETE' }), `${u.name} was deleted.`);
  };

  if (!users || !overview) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const count = (r, s) => overview.users.filter((x) => x.role === r && (!s || x.status === s)).reduce((t, x) => t + x.count, 0);

  return (
    <div className="stack-lg">
      <section className="card hero-card">
        <div className="row spread">
          <div>
            <p className="eyebrow">{superAdmin ? 'Super admin' : 'Administrator'}</p>
            <h1>School admin</h1>
            <p className="muted">
              {superAdmin
                ? 'You can manage every account, including admins.'
                : 'You can manage teachers and students. Only a super admin can change admin accounts or delete accounts.'}
            </p>
          </div>
          {!creating && <button type="button" className="btn primary" onClick={() => setCreating(true)}><Icon name="user" /> New account</button>}
        </div>
      </section>

      <div className="stats">
        <Stat icon="users" value={count('student', 'approved')} label="active students" />
        <Stat icon="hourglass" value={count('student', 'pending')} label="students waiting for approval" tone={count('student', 'pending') ? 'warn' : ''} />
        <Stat icon="school" value={count('teacher')} label="teachers" />
        <Stat icon="shield" value={count('admin') + count('super_admin')} label="admins and super admins" />
        <Stat icon="flame" value={overview.activity.active_students_week} label={`students practised this week (${overview.activity.attempts_week} answers)`} />
        <Stat icon="list" value={`${overview.assignments.open} / ${overview.assignments.total}`} label={<Link to="/teacher/assignments">assignments open</Link>} />
      </div>

      {creating && (
        <NewUser roles={manageable} options={options} onCancel={() => setCreating(false)}
          onCreate={(body) => run(async () => {
            const d = await api('/admin/users', { method: 'POST', body });
            setCreating(false);
            return d;
          }, `Account created for ${body.name}. They can log in as @${body.username}.`)} />
      )}

      {notice && <p className="ok-text">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="toolbar">
          <h2 className="grow">Accounts</h2>
          <span className="search-box"><Icon name="search" /><input type="search" placeholder="Name, login, email or class" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="seg">
            {[['', 'All'], ['approved', 'Active'], ['pending', 'Pending'], ['rejected', 'Blocked']].map(([v, l]) => (
              <button type="button" key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>
            ))}
          </div>
        </div>

        {users.length === 0 ? <p className="muted">No accounts match.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Status</th><th>Details</th><th>Last seen</th><th /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} u={u} me={u.id === user.id} roles={manageable} superAdmin={superAdmin}
                    editing={editing === u.id} options={options}
                    onEdit={() => setEditing(editing === u.id ? null : u.id)}
                    onSave={(body) => run(async () => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body }); setEditing(null); }, `Saved ${u.name}.`)}
                    onStatus={(s) => setUserStatus(u, s)} onRole={(r) => changeRole(u, r)}
                    onPassword={() => resetPassword(u)} onDelete={() => remove(u)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserRow({ u, me, roles, superAdmin, editing, options, onEdit, onSave, onStatus, onRole, onPassword, onDelete }) {
  const details = u.role === 'student'
    ? [u.grade && `Grade ${u.grade}`, u.class_name && `Class ${u.class_name}`, u.subject_name, u.teacher_name && `Teacher: ${u.teacher_name}`].filter(Boolean).join(' · ')
    : u.role === 'teacher'
      ? [u.teaches.map((t) => t.name).join(', ') || 'No subjects', `${u.student_count} student${u.student_count === 1 ? '' : 's'}`].join(' · ')
      : u.created_by_name ? `Appointed by ${u.created_by_name}` : '';
  return (
    <>
      <tr>
        <td>
          <span className="who-cell">
            <span className="avatar sm">{initials(u.name)}</span>
            <span>
              {u.role === 'student' ? <Link to={`/teacher/student/${u.id}`}><b>{u.name}</b></Link> : <b>{u.name}</b>}
              {me && <span className="badge" style={{ marginLeft: 6 }}>you</span>}
              <br /><span className="muted small">@{u.username}{u.email ? ` · ${u.email}` : ''}</span>
            </span>
          </span>
        </td>
        <td>
          {u.can_manage ? (
            <select value={u.role} onChange={(e) => onRole(e.target.value)} style={{ width: 'auto' }}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          ) : ROLE_LABELS[u.role]}
        </td>
        <td><span className={`status-pill ${u.status}`}>{STATUS_LABELS[u.status]}</span></td>
        <td className="small">{details}</td>
        <td className="muted small">{timeAgo(u.last_seen_at)}</td>
        <td>
          {u.can_manage ? (
            <div className="row nowrap">
              {u.status !== 'approved' && <button type="button" className="btn sm primary" onClick={() => onStatus('approved')}>Approve</button>}
              {u.status === 'approved' && <button type="button" className="btn sm ghost" onClick={() => onStatus('rejected')}>Block</button>}
              <button type="button" className="btn sm" onClick={onEdit}>{editing ? 'Close' : 'Edit'}</button>
              <button type="button" className="btn sm ghost" onClick={onPassword} title="Set a new password"><Icon name="lock" size={14} /></button>
              {superAdmin && <button type="button" className="btn sm ghost" onClick={onDelete} title="Delete account"><Icon name="trash" size={14} /></button>}
            </div>
          ) : <span className="muted small">{me ? 'Use Account page' : 'Super admin only'}</span>}
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={6}><EditUser u={u} options={options} onSave={onSave} onCancel={onEdit} /></td>
        </tr>
      )}
    </>
  );
}

function EditUser({ u, options, onSave, onCancel }) {
  const [f, setF] = useState({
    name: u.name, email: u.email || '', class_name: u.class_name, grade: String(u.grade || ''),
    subjects: u.teaches.map((t) => t.id),
  });
  const [choices, setChoices] = useState(() => choicesOf(u));
  const [problem, setProblem] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { name: f.name, email: f.email };
    if (u.role === 'student') {
      const p = choicesProblem(f.grade, choices);
      setProblem(p);
      if (p) return;
      Object.assign(body, { class_name: f.class_name, grade: Number(f.grade), subjects: choices });
    }
    if (u.role === 'teacher') body.subjects = f.subjects;
    onSave(body);
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid three">
        <label>Name<input value={f.name} onChange={set('name')} required /></label>
        <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
        {u.role === 'student' && <label>Class<input value={f.class_name} onChange={set('class_name')} required /></label>}
        {u.role === 'student' && (
          <GradeSelect value={f.grade} onChange={(grade) => setF({ ...f, grade })} subjects={options.subjects} choices={choices} onChoices={setChoices} />
        )}
      </div>
      {u.role === 'student' && <SubjectPicker grade={f.grade} subjects={options.subjects} teachers={options.teachers} value={choices} onChange={setChoices} />}
      {u.role === 'teacher' && <SubjectChecks subjects={options.subjects} value={f.subjects} onChange={(subjects) => setF({ ...f, subjects })} />}
      {problem && <p className="error">{problem}</p>}
      <div className="row">
        <button type="submit" className="btn primary sm">Save</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function SubjectChecks({ subjects, value, onChange }) {
  return (
    <div>
      <p className="muted small">Teaches</p>
      <div className="row">
        {subjects.map((s) => (
          <label key={s.id} className="row nowrap" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={value.includes(s.id)}
              onChange={() => onChange(value.includes(s.id) ? value.filter((x) => x !== s.id) : [...value, s.id])} />
            {s.name}
          </label>
        ))}
      </div>
    </div>
  );
}

function NewUser({ roles, options, onCreate, onCancel }) {
  const [f, setF] = useState({
    role: roles.includes('teacher') ? 'teacher' : roles[0], name: '', username: '', email: '', password: '',
    subjects: [], class_name: '', grade: '',
  });
  const [choices, setChoices] = useState([]);
  const [problem, setProblem] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { role: f.role, name: f.name, username: f.username, email: f.email, password: f.password };
    if (f.role === 'teacher') body.subjects = f.subjects;
    if (f.role === 'student') {
      const p = choicesProblem(f.grade, choices);
      setProblem(p);
      if (p) return;
      Object.assign(body, { class_name: f.class_name, grade: Number(f.grade), subjects: choices });
    }
    onCreate(body);
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <h2>New account</h2>
      <div className="grid three">
        <label>Role
          <select value={f.role} onChange={set('role')}>
            {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </label>
        <label>Full name<input value={f.name} onChange={set('name')} required /></label>
        <label>Login name<input value={f.username} onChange={set('username')} pattern="[A-Za-z0-9._\-]{3,30}" title="3–30 letters, numbers, dots, dashes or underscores" required /></label>
        <label>Email <span className="label-note">(optional)</span><input type="email" value={f.email} onChange={set('email')} /></label>
        <label>Password<input type="text" value={f.password} onChange={set('password')} minLength={8} required autoComplete="new-password" /></label>
        {f.role === 'student' && <label>Class<input value={f.class_name} onChange={set('class_name')} required /></label>}
        {f.role === 'student' && (
          <GradeSelect value={f.grade} onChange={(grade) => setF({ ...f, grade })} subjects={options.subjects} choices={choices} onChoices={setChoices} />
        )}
      </div>
      {f.role === 'student' && <SubjectPicker grade={f.grade} subjects={options.subjects} teachers={options.teachers} value={choices} onChange={setChoices} />}
      {f.role === 'teacher' && <SubjectChecks subjects={options.subjects} value={f.subjects} onChange={(subjects) => setF({ ...f, subjects })} />}
      {problem && <p className="error">{problem}</p>}
      {(f.role === 'admin' || f.role === 'super_admin') && (
        <p className="muted small">{f.role === 'admin' ? 'Admins can see everything and manage teachers and students.' : 'Super admins can do everything, including managing admins.'}</p>
      )}
      <div className="row">
        <button type="submit" className="btn primary">Create account</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
