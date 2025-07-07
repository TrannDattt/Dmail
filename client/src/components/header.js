// components/Header.js
import { Link } from 'react-router-dom';
import { isLoggedIn } from '../auth';
import { useState, useEffect } from 'react';

export default function Header({ onLogout }) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    const interval = setInterval(() => {
      setLoggedIn(isLoggedIn());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f0f0f0',
      padding: '10px 50px 10px 20px',
      borderBottom: '1px solid #ccc'
    }}>
      <h1 style={{ margin: 0 }}>📬 Dmail</h1>
      <nav>
        {loggedIn ? (
          <button onClick={onLogout}>Đăng xuất</button>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '10px' }}>Đăng nhập</Link>
            <span>| </span>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </nav>
    </header>
  );
}
