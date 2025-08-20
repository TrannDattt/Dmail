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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      setEmails([]);
      try {
        let res;
        if (!isDefaultFilter(filters)) {
          res = await axios.post(`/api/emails/search/${folder}`, filters, {
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
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [folder, filters]);

  // console.log(emails);

  const getFolderName = (folder) => {
    switch (folder) {
      case 'inbox':
        return 'Hộp thư đến';
      case 'sent':
        return 'Thư đã gửi';
      default:
        return folder.charAt(0).toUpperCase() + folder.slice(1);
    }
  }
  
  return (
    <div className='mail-list'>
      <h1>{getFolderName(folder)}</h1>
      {loading ? (
        <p>Đang tải email...</p>
      ) : emails.length === 0 ? (
        <p>Không có email phù hợp.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li className='mail-card'
              key={email.uid}
              onClick={() => navigate(`/email/${folder}/${email.uid}`)}
            >
              <strong>Chủ đề:</strong> {email.subject} | 
              <strong> {folder === 'sent' ? 'Từ:' : 'Đến:'} </strong> {folder === 'sent' ? email.to : email.from}
              <br />
              <small>{new Date(email.date).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
