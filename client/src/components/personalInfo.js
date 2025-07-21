import { useState, useEffect } from 'react';
import axios from 'axios';
import './personalInfo.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function PersonalInfo() {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    dob: '',
    country: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_URL}/api/change-my-info`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Cập nhật thành công');
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert('Cập nhật thất bại');
    }
  };

  const getUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      var curUser = res.data.user;
      setUser(curUser);
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        phone: user.phone || '',
        dob: user.dob ? user.dob.slice(0, 10) : '',
        country: user.country || ''
      });
    }
  }, [user]);

  return (
    <div className="personal-info">
      <img
        src={user?.avatar || '/logo192.png'}
        alt="avatar"
        className="avatar"
        onClick={() => setShowPopup(!showPopup)}
      />

      {showPopup && (
        <div className="popup">
          {editMode ? (
            <>
              <label>Username:</label>
              <input name="username" value={formData.username} onChange={handleChange} />

              <label>Phone:</label>
              <input name="phone" value={formData.phone} onChange={handleChange} />

              <label>Ngày sinh:</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} />

              <label>Quốc gia:</label>
              <input name="country" value={formData.country} onChange={handleChange} />

              <div className="button-group">
                <button onClick={handleSave}>Lưu</button>
                <button onClick={() => setEditMode(false)}>Hủy</button>
              </div>
            </>
          ) : (
            <>
              <p><strong>Username:</strong> {formData.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Ngày sinh:</strong> {formData.dob}</p>
              <p><strong>Quốc gia:</strong> {formData.country}</p>
              <button onClick={() => setEditMode(true)}>Chỉnh sửa</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
