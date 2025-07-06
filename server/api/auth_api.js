const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu không khớp' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });

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

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

module.exports = router;
