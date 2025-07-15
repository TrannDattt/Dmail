import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './emailDetail.css'

const API_URL = process.env.REACT_APP_API_URL;

export default function EmailDetail() {
  const { id } = useParams();
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    // console.log('ENV:', process.env);
    const fetchEmail = async () => {
      try {
        const res = await axios.get(`/api/emails/detail/${id}`, {
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

  const downloadFile = async (filename, originalname) => {
    try {
      console.log(originalname)
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/emails/download/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = originalname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Tải file thất bại:', err);
      alert("Tải thất bại!");
    }
  };

  if (!email) return <div>Đang tải...</div>;

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
          {email.attachments.map((att, i) => {
            const fileName = att.path.split(/[\\/]/).pop();
            const fileUrl = `${API_URL}/uploads/${fileName}`;
            const downloadFilename = att.filename;
            // console.log(fileUrl)
            
            const isImage = att.mimetype.startsWith('image/');
            const isPDF = att.mimetype === 'application/pdf';

            return (
              <li key={i}>
                {isImage ? (
                  <>
                    <a href={fileUrl} target="_blank" rel="noreferrer">
                      📄 {att.filename}
                    </a>
                    <img
                      src={fileUrl}
                      alt={att.filename}
                      style={{ maxWidth: '150px', display: 'block' }}
                    />
                  </>
                ) : isPDF ? (
                  <iframe
                    src={fileUrl}
                    style={{ width: '100%', height: '400px' }}
                    title={att.filename}
                  ></iframe>
                ) : (
                  <a href={fileUrl} target="_blank" rel="noreferrer">
                    📄 {att.filename}
                  </a>
                )}

                <button className='download-file-btn' onClick={() => downloadFile(fileName, downloadFilename)}>
                  ⬇ Tải xuống
                </button>
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}
