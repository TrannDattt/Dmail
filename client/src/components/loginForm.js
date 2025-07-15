import { useState, useEffect } from 'react';
import axios from 'axios';
import { saveToken } from '../auth';
import { useNavigate } from 'react-router-dom';

import './loginRegisterForm.css';

const CLIENT_ID = process.env.REACT_APP_LAOID_CLIENT_ID;
const CALLBACK_URI = process.env.REACT_APP_LAOID_CALLBACK_URI;

export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();


  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://demo-sso.tinasoft.io/laoid.auth.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.LaoIdSSO && window.LaoIdSSO.init) {
        window.LaoIdSSO.init(CLIENT_ID, CALLBACK_URI, CALLBACK_URI);
      }
    };

    const onMessage = (event) => {
      if (event.origin !== 'https://demo-sso.tinasoft.io') return;

      const { data } = event.data;
      window.location.href = `/laoid/auth/callback?code=${data}`;
    };

    window.addEventListener("message", onMessage, false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', form);
      saveToken(res.data.token);
      navigate('/inbox');
    } catch (err) {
      alert('Sai email hoặc mật khẩu');
    }
  };

  return (
    <form className='login-register-form' onSubmit={handleSubmit}>
      <h1>Đăng nhập</h1>
      <input 
        name="email" 
        placeholder="Email" 
        onChange={e => setForm({ ...form, email: e.target.value })} 
      />
      <input 
        name="password" 
        type="password" 
        placeholder="Password" 
        onChange={e => setForm({ ...form, password: e.target.value })} 
      />
      <button type="submit">Đăng nhập</button>
      <button 
        type="button" 
        id="laoid-signin" 
        className="laoid-login-btn"
      >
        Đăng nhập qua LaoID
      </button>
    </form>
  );
}
