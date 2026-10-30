import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Paper from './pages/Paper.jsx';
import Question from './pages/Question.jsx';
import Bookmarks from './pages/Bookmarks.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="paper/:paper" element={<Paper />} />
        <Route path="question/:id" element={<Question />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
