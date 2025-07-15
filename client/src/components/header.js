import { Link } from 'react-router-dom';
import { isLoggedIn } from '../auth';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PersonalInfo from './personalInfo'

import './header.css'

const API_URL = process.env.REACT_APP_API_URL;

export default function Header({ onLogout, onSearch }) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    from: '',
    subject: '',
    date: '',
    keyword: ''
  });


  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
    setShowFilter(false);
  };

  const getUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data.user);
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const logged = isLoggedIn();
      setLoggedIn(logged);
      if (logged && !user) {
        getUser();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="header">
      <h1 className="logo">📬 Dmail</h1>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          name="keyword"
          placeholder="Tìm kiếm nội dung..."
          value={filters.keyword}
          onChange={handleChange}
        />
        <button type="button" onClick={() => setShowFilter(!showFilter)}>🔍 Filter</button>
        <button type="submit">Search</button>
      </form>

      {showFilter && (
        <div className="filter-box">
          <label>From:</label>
          <input type="text" name="from" value={filters.from} onChange={handleChange} />

          <label>Subject:</label>
          <input type="text" name="subject" value={filters.subject} onChange={handleChange} />

          <label>Date:</label>
          <input type="date" name="date" value={filters.date} onChange={handleChange} />
        </div>
      )}

      <nav className="auth-buttons">
        {loggedIn ? (
          <>
            <PersonalInfo user={user} />
            <button onClick={onLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link> |
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </nav>
    </header>
  );
}