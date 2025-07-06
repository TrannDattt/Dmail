import { useState } from 'react';
import axios from 'axios';
import { saveToken } from '../auth';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

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
    <form onSubmit={handleSubmit}>
      <h2>Đăng nhập</h2>
      <input name="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input name="password" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
