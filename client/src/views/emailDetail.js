import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './emailDetail.css'

const API_URL = process.env.REACT_APP_API_URL;

export default function EmailDetail() {
  const { id, folder } = useParams();
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await axios.get(`/api/emails/detail/${folder}/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setEmail(res.data);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết email:', err);
        navigate('/');
      }
    };

    fetchEmail();
  }, [id, navigate]);

  const downloadFile = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/emails/download/${folder}/${id}/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Tải file thất bại:', err);
      alert("Tải file đính kèm thất bại!");
    }
  };

  if (!email) return <div>Đang tải...</div>;

  console.log(email.attachments)

  return (
    <div className='mail-detail'>
      <div className='mail-detail-btn-container'>
        <button onClick={() => navigate(-1)}>← Quay lại</button>
      </div>
      <h2>{email.subject}</h2>
      <p><strong>From:</strong> {email.from}</p>
      <p><strong>To:</strong> {email.to}</p>
      <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
      <hr />
      <p>{email.body}</p>

      {email.attachments?.length > 0 && (
        <div className='attached-files'>
          <h4>File đính kèm:</h4>
          <ul>
            {email.attachments.map((att, i) => (
              <li key={i} style={{ marginBottom: '20px' }}>
                <p><strong>📎 {att.filename}</strong></p>
                <button
                  className="download-file-btn"
                  onClick={() => downloadFile(att.filename)}
                >
                  ⬇ Tải xuống
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
