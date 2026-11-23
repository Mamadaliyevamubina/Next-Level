import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { isAdmin, isStudent, isTeacher, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import PublicLayout from './components/Site.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Pending from './pages/Pending.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Paper from './pages/Paper.jsx';
import Question from './pages/Question.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Account from './pages/Account.jsx';
import Teacher from './pages/Teacher.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import MyAssignments from './pages/MyAssignments.jsx';
import AssignmentWork from './pages/AssignmentWork.jsx';
import TeacherAssignments from './pages/TeacherAssignments.jsx';
import TeacherAssignment from './pages/TeacherAssignment.jsx';
import MockMarking from './pages/MockMarking.jsx';
import Admin from './pages/Admin.jsx';
import TeacherHome from './pages/TeacherHome.jsx';
import PracticeBank from './pages/PracticeBank.jsx';
import Competition from './pages/Competition.jsx';
import AiFeedback from './pages/AiFeedback.jsx';

// Any page that needs an account sends visitors to log in, then back to that page.
function LoginFirst() {
  const { pathname, search } = useLocation();
  const { signedOut } = useAuth();
  if (signedOut) return <Navigate to="/" replace />;
  return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
}

// After logging in, /login and /signup forward to the page the visitor wanted (or the dashboard).
function AfterLogin() {
  const next = new URLSearchParams(useLocation().search).get('next');
  return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/'} replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;

  if (!user) {
    return (
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="login" element={<Login mode="login" />} />
        <Route path="signup" element={<Login mode="register" />} />
        <Route path="*" element={<LoginFirst />} />
      </Routes>
    );
  }

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
      <Route path="login" element={<AfterLogin />} />
      <Route path="signup" element={<AfterLogin />} />
      <Route element={<Layout />}>
        {/* Teachers' main page shows their classes; the question bank has its own section (/practice). */}
        <Route index element={isTeacher(user) ? <TeacherHome /> : <Dashboard />} />
        <Route path="courses" element={<Home />} />
        <Route path="paper/:paper" element={<Paper />} />
        <Route path="question/:id" element={<Question />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="account" element={<Account />} />
        <Route path="competition" element={<Competition />} />
        {isTeacher(user) && <Route path="practice" element={<PracticeBank />} />}
        {isTeacher(user) && <Route path="teacher" element={<Teacher />} />}
        {isTeacher(user) && <Route path="teacher/student/:id" element={<StudentDetail />} />}
        {isTeacher(user) && <Route path="teacher/assignments" element={<TeacherAssignments />} />}
        {isTeacher(user) && <Route path="teacher/feedback" element={<AiFeedback />} />}
        {isTeacher(user) && <Route path="teacher/assignments/:id" element={<TeacherAssignment />} />}
        {isTeacher(user) && <Route path="teacher/assignments/:id/mark/:studentId" element={<MockMarking />} />}
        {isStudent(user) && <Route path="assignments" element={<MyAssignments />} />}
        {isStudent(user) && <Route path="assignments/:id" element={<AssignmentWork />} />}
        {isAdmin(user) && <Route path="admin" element={<Admin />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
