import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './views/loginView';
import RegisterPage from './views/registerView';
import HomePage from './views/homeView';
import EmailDetail from './views/emailDetail';
import { isLoggedIn, logout } from './auth';
import Header from './components/header';
import LaoidCallback from './views/laoIdCallback';

import './App.css';

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

function AppContent(){
  const [filters, setFilters] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();;
    navigate('/login');
  };

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    navigate('/inbox');
  };

  return (
    <>
      <Header onLogout={handleLogout} onSearch={handleSearch} />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/inbox/" element={<PrivateRoute><HomePage filters={filters} /></PrivateRoute>} />
        <Route path="/email/:id" element={<EmailDetail />} />
        <Route path="/laoid/auth/callback" element={<LaoidCallback />} />
        <Route path="*" element={
            isLoggedIn() ? <Navigate to="/inbox" /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
