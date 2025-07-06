import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/loginView';
import RegisterPage from './views/registerView';
import InboxPage from './views/inboxView';
import EmailDetail from './views/emailDetail';
import { isLoggedIn, logout } from './auth';
import { useEffect, useState } from 'react';

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    const interval = setInterval(() => {
      setLoggedIn(isLoggedIn());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <Router>
      <nav>
        {loggedIn ? (
          <>
            <button onClick={handleLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <a href="/login">Đăng nhập</a> | <a href="/register">Đăng ký</a>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/inbox/" element={<PrivateRoute><InboxPage /></PrivateRoute>} />
        <Route path="/email/:id" element={<EmailDetail />} />
        <Route path="*" element={
            isLoggedIn() ? <Navigate to="/inbox" /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}
