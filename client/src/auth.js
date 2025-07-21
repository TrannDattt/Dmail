import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('token');
}

export async function getUser(){
  const token = localStorage.getItem('token');
  try {
    const res = await axios.get(`${API_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return(res.data.user);
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    return null;
  }
}
