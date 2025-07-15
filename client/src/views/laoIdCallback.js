import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../auth';
import axios from 'axios';

const APP_URL = process.env.REACT_APP_API_URL;

export default function LaoidCallback() {
  const navigate = useNavigate();


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (code) {
      axios.post(`${APP_URL}/api/laoid/exchange-code`, { code })
        .then(res => {
          saveToken(res.data.token);
          navigate('/inbox');
        })
        .catch(err => {
          console.error(err);
          alert('Đăng nhập LaoID thất bại');
          navigate('/');
        });
    } else {
      alert('Thiếu mã xác thực');
      navigate('/');
    }
  }, [navigate]);

  return <div>Đang xử lý đăng nhập...</div>;
}