import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EmailList({ folder }) {
  const [emails, setEmails] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await axios.get(`/api/emails/${folder}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setEmails(res.data);
      } catch (err) {
        console.error('Lỗi khi tải email:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    };

    fetchEmails();
  }, [folder]);

  return (
    <div>
      <h2>{folder.toUpperCase()}</h2>
      <ul>
        {emails.map(email => (
          <li
            key={email._id}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
            onClick={() => navigate(`/email/${email._id}`)}
          >
            <strong>{email.subject}</strong> — {folder === 'sent' ? email.to : email.from}
            <br />
            <small>{new Date(email.date).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
