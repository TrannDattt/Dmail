import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/loginView';
import RegisterPage from './views/registerView';
import HomePage from './views/homeView';
import EmailDetail from './views/emailDetail';
import { isLoggedIn, logout } from './auth';
import Header from './components/header';

import './App.css';

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

export default function App() {
  const handleLogout = () => {
    logout();;
    window.location.href = '/login';
  };

  return (
    <Router>
      <Header onLogout={handleLogout} />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/inbox/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/email/:id" element={<EmailDetail />} />
        <Route path="*" element={
            isLoggedIn() ? <Navigate to="/inbox" /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}
