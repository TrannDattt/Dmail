import { Link } from 'react-router-dom';
import { isLoggedIn } from '../auth';
import { useState, useEffect } from 'react';

import './header.css'

export default function Header({ onLogout, onSearch }) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
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

  useEffect(() => {
    const interval = setInterval(() => {
      setLoggedIn(isLoggedIn());
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
          <button onClick={onLogout}>Đăng xuất</button>
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