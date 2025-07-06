import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import EmailList from '../components/mailList';
import SendEmailForm from '../components/sendMailForm';
import EmailDetail from './emailDetail';

export default function InboxView() {
  const [folder, setFolder] = useState('inbox');
  const [composeVisible, setComposeVisible] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <h1>📬 Hộp thư</h1>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setFolder('inbox')}>📥 Inbox</button>
        <button onClick={() => setFolder('sent')}>📤 Sent</button>
        <button onClick={() => setComposeVisible(true)}>✉️ Soạn thư</button>
      </div>

      {composeVisible && (
        <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <SendEmailForm onClose={() => setComposeVisible(false)} />
        </div>
      )}

      <EmailList folder={folder} />
    </div>
  );
}