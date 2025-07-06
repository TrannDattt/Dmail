import { useState } from 'react';
import axios from 'axios';

export default function SendEmailForm({ onClose }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);

  const handleSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', body);

    for (const file of files) {
      formData.append('attachments', file);
    }

    try {
      await axios.post('/api/emails/send', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Đã gửi!');
      if (onClose) onClose();
    } catch (err) {
      console.error('Lỗi gửi:', err);
      alert('Lỗi gửi email');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>✉️ Soạn thư</h3>
      <input type="email" placeholder="To" value={to} onChange={e => setTo(e.target.value)} required />
      <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} required />
      <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} required />
      <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} />
      <button type="submit">Gửi</button>
      {onClose && <button type="button" onClick={onClose}>Đóng</button>}
    </form>
  );
}