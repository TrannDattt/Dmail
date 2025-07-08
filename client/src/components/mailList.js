import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './mailList.css'

export default function EmailList({ folder, filters }) {
  const [emails, setEmails] = useState([]);
  const navigate = useNavigate();

  const isDefaultFilter = (filters) => {
    return (
      !filters ||
      Object.values(filters).every(value => value === '')
    );
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        let res;

        if (!isDefaultFilter(filters)) {
          res = await axios.post('/api/emails/search', filters, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        } else {
          res = await axios.get(`/api/emails/${folder}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        }

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
  }, [folder, filters]);

  return (
    <div className='mail-list'>
      <h1>{folder.toUpperCase()}</h1>
      <ul>
        {emails.length === 0 ? (
        <p>Không có email phù hợp.</p>
        ) : (
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
        )}
      </ul>
    </div>
  );
}
