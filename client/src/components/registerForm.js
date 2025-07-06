import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      alert('Email đã tồn tại');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng ký</h2>
      <input name="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input name="password" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <input name="confirm-password" type="password" placeholder="Confirm Password" onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
      <button type="submit">Đăng ký</button>
    </form>
  );
}
