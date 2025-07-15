const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const auth = require('../middleware/auth_middleware');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu không khớp' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ 
      email, 
      password: hashed,
      username: 'Username',
      dob: '',
      phone: '',
      country: '',
      avatar: ''
    });

    return res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server, thử lại sau' });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin người dùng' });
  }
});

router.put('/change-my-info', auth, async (req, res) => {
  const userId = req.user.userId;
  const { username, phone, dob, country } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { username, phone, dob, country },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Cập nhật thất bại' });
  }
});

router.post('/laoid/exchange-code', async (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).json({ message: 'Thiếu mã code' });

  try {
    const verifyResponse = await axios.post(`${process.env.LAOID_BASE_URL}/api/v1/third-party/verify`,
      {
        code,
        clientId: process.env.LAOID_CLIENT_ID,
        clientSecret: process.env.LAOID_CLIENT_SECRET,
      },
      {
        headers: {
        'X-Accept-Language': 'vi'
        }
      }
    );

    const tokenData = verifyResponse.data?.data;
    const accessToken = tokenData?.accessToken;
    const expiresIn = tokenData?.expiresIn;

    if (!accessToken) {
      return res.status(401).json({ error: 'Không lấy được accessToken từ LaoID' });
    }

    const userResponse = await axios.get(`${process.env.LAOID_BASE_URL}/api/v1/third-party/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': process.env.LAOID_CLIENT_ID,
        'X-Accept-Language': 'vi',
      }
    });

    const laoUser = userResponse.data?.data;
    if (!laoUser) return res.status(500).json({ error: 'Không lấy được thông tin người dùng' });

    const primaryEmail = laoUser.email?.find(e => e.primary)?.email || '';
    let user = await User.findOne({email: primaryEmail });

    if (!user) {
      user = await User.create({
        email: primaryEmail,
        password: '',
        username: `${laoUser.firstName || ''}${laoUser.lastName? ` ${laoUser.lastName}` : ''}` || 'Username',
        dob: laoUser.dateOfBirth || '',
        phone: laoUser.phoneNumber?.find(e => e.primary)?.phoneNumber || '',
        country: laoUser.country || '',
        avatar: laoUser.avatar || '',
      });
    }

    const jwtToken = jwt.sign({ userId: user._id, email: primaryEmail }, JWT_SECRET, { expiresIn: expiresIn });
    res.json({ token: jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Đăng nhập thất bại' });
  }
});

module.exports = router;
