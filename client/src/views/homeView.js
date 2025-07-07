import { useState, useEffect, useRef } from 'react';
import EmailList from '../components/mailList';
import SendEmailForm from '../components/sendMailForm';

import './homeView.css'

export default function HomeView() {
  const [folder, setFolder] = useState('inbox');
  const [composeVisible, setComposeVisible] = useState(false);
  const composerRef = useRef(null);

  useEffect(() => {
    if (composeVisible && composerRef.current) {
      composerRef.current.focus();
    }
  }, [composeVisible]);

  return (
    <div className='home-view'>
      <div className='side-bar'>
        <h1>📬 Hộp thư</h1>
        <div className='sidebar-btn-container' style={{
          
        }}>
          <button
            onClick={() => {
              setComposeVisible(true);
            }}
            className={composeVisible ? 'active' : ''}
          >
            ✉️ Soạn thư
          </button>

          <button
            onClick={() => {
              setFolder('inbox');
              setComposeVisible(false);
            }}
            className={folder === 'inbox' && !composeVisible ? 'active' : ''}
          >
            📥 Inbox
          </button>

          <button
            onClick={() => {
              setFolder('sent');
              setComposeVisible(false);
            }}
            className={folder === 'sent' && !composeVisible ? 'active' : ''}
          >
            📤 Sent
          </button>
        </div>
      </div>

      {composeVisible && (
        <div className={`mail-composer ${composeVisible ? 'active' : ''}`}
          ref={composerRef}
          tabIndex={-1}
        >
          <SendEmailForm onClose={() => setComposeVisible(false)} />
        </div>
      )}

      <EmailList folder={folder} />
    </div>
  );
}