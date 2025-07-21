import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './loginRegisterForm.css';

export default function RegisterForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', form);
      alert('Đăng ký thành công');
      navigate('/login');
    } catch (err) {
      console.log(err);
      alert('Đăng ký thất bại.');
    }
  };

  return (
    <form className='login-register-form' onSubmit={handleSubmit}>
      <h1>Đăng ký</h1>
      <input name="email" placeholder="User@mail.local" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input name="password" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <input name="confirm-password" type="password" placeholder="Confirm Password" onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
      <button type="submit">Đăng ký</button>
    </form>
  );
}
