import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './mailList.css'

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
    <div className='mail-list'>
      <h1>{folder.toUpperCase()}</h1>
      <ul>
        {emails.map(email => (
          <li className='mail-card'
            key={email._id}
            onClick={() => navigate(`/email/${email._id}`)}
          >
            <strong>Subject:</strong> {email.subject} | 
            <strong> From:</strong> {folder === 'sent' ? email.to : email.from}
            <br />
            <small>{new Date(email.date).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
