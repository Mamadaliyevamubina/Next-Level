import { Navigate, Route, Routes } from 'react-router-dom';
import { isTeacher, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Pending from './pages/Pending.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Paper from './pages/Paper.jsx';
import Question from './pages/Question.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Account from './pages/Account.jsx';
import Teacher from './pages/Teacher.jsx';
import StudentDetail from './pages/StudentDetail.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Login />;

  // Students who are not approved yet can only see the waiting page and their account settings.
  if (user.status !== 'approved') {
    return (
      <Routes>
        <Route element={<Layout limited />}>
          <Route index element={<Pending />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="paper/:paper" element={<Paper />} />
        <Route path="question/:id" element={<Question />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="account" element={<Account />} />
        {isTeacher(user) && <Route path="teacher" element={<Teacher />} />}
        {isTeacher(user) && <Route path="teacher/student/:id" element={<StudentDetail />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
