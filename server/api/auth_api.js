const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const auth = require('../middleware/auth_middleware');
const User = require('../models/user');
const { spawnSync, execSync } = require('child_process');
const { encrypt, decrypt } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logging');

const JWT_SECRET = process.env.JWT_SECRET;
const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL;

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@mail\.local$/;
  return emailRegex.test(email);
}

async function createLinuxUser(username, password) {
  try {
    await axios.post(`${MAIL_SERVER_URL}/internal/create-user`, {
      username,
      password,
    });
    console.log(`✅ User ${username} created in mail-server`);
    // logger.logCreateUser(username, ip);
  } catch (err) {
    console.error(`❌ Failed to create user in mail-server:`, err.message);
  }
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const { ip } = req.clientInfo;

    if (!email || !password || !confirmPassword) {
      logger.logError('Register', new Error('Missing fields'), ip);
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isValidEmail(email)) {
      logger.logError('Register', new Error('Invalid email format'), ip);
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password !== confirmPassword) {
      logger.logError('Register', new Error('Passwords do not match'), ip);
      return res.status(400).json({ message: 'Mật khẩu không khớp' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      logger.logError('Register', new Error('Email already exists'), ip);
      return res.status(400).json({ message: `Email ${email} đã tồn tại` });
    }

    const hashed = await bcrypt.hash(password, 10);
    const encrypted = encrypt(password);
    const username = email.split('@')[0];

    // 👉 1. Tạo user hệ thống (Linux)
    createLinuxUser(username, password);

    // 👉 2. Tạo user trong MongoDB
    await User.create({ 
      email, 
      password: hashed,
      imapPass: encrypted,
      username: username,
      dob: '',
      phone: '',
      country: '',
      avatar: ''
    });

    logger.logRegister(email, username, ip);
    return res.status(201).json({ message: 'Đăng ký & tạo user hệ thống thành công' });
  } catch (err) {
    // console.error(err);
    logger.logError('Register', err, ip);
    return res.status(500).json({ message: 'Lỗi server, thử lại sau' });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { ip } = req.clientInfo;

    if (!email || !password) {
      logger.logLogin(email, ip, false);
      logger.logError('Register', new Error('Missing fields'), ip);
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (!isValidEmail(email)) {
      logger.logLogin(email, ip, false);
      logger.logError('Register', new Error('Invalid email format'), ip);
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.logLogin(email, ip, false);
      logger.logError('Register', new Error('User not found'), ip);
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.logLogin(email, ip, false);
      logger.logError('Register', new Error('Invalid password'), ip);
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });

    logger.logLogin(email, ip);
    res.json({ token });
});

router.get('/all-users', async (req, res) => {
// router.get('/all-users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    for (const user of users) {
      const username = user.email.split('@')[0];
      const password = decrypt(user.imapPass);
      createLinuxUser(username, password);
    }

    res.json({ success: true, message: 'Lấy danh sách người dùng thành công'});
  } catch (err) {
    console.error(err);
    // logger.logError('Get All Users', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách người dùng' });
  }
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

// Xóa user dựa trên email (chỉ admin gọi, hoặc bảo vệ bằng JWT admin)
router.delete('/delete/:email', auth, async (req, res) => {
  try {
    const email = req.params.email;
    const username = email.split('@')[0];

    // Xóa user khỏi hệ thống Linux
    try {
      execSync(`sudo userdel -r ${username}`);
    } catch (err) {
      console.error(`Không thể xóa user Linux: ${err.message}`);
    }
    
    const deleted = await User.findOneAndDelete({ email });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({ message: `Đã xóa user ${email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xóa user' });
  }
});

router.post('/laoid/exchange-code', async (req, res) => {
  const { ip } = req.clientInfo;
  const code = req.body.code;
  
  if (!code) {
    logger.logError('LaoID login', new Error('Can not get verification code'), ip);
    return res.status(400).json({ message: 'Thiếu mã code' });
  }

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
      logger.logError('LaoID login', new Error('Can not get access token'), ip);
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
    if (!laoUser) {
      logger.logError('LaoID login', new Error('Can not get user data'), ip);
      return res.status(500).json({ error: 'Không lấy được thông tin người dùng' });
    }

    const laoEmail = laoUser.email?.find(e => e.primary)?.email || '';
    const laoUsername = `${laoUser.firstName || ''}${laoUser.lastName ? `_${laoUser.lastName}` : ''}` || ''
    const laoPhone = laoUser.phoneNumber?.find(e => e.primary)?.phoneNumber || ''

    const localEmail = laoEmail ? `${laoEmail.split('@')[0]}@mail.local` 
                      : laoUsername ? `${laoUsername}@mail.local` 
                      : laoPhone ? `${laoPhone}@mail.local`
                      : `user_${Date.now()}@mail.local`;

    let user = await User.findOne({email: localEmail });

    const username = localEmail.split('@')[0];
    const defaultPassword = uuidv4();
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const encrypted = encrypt(defaultPassword);
    
    if(!user) {
      createLinuxUser(username, defaultPassword);

      user = await User.create({
        email: localEmail,
        password: hashed,
        imapPass: encrypted,
        username: `${laoUser.firstName || ''}${laoUser.lastName? ` ${laoUser.lastName}` : ''}` || 'Username',
        dob: laoUser.dateOfBirth || '',
        phone: laoPhone,
        country: laoUser.country || '',
        avatar: laoUser.avatar || '',
      });
    }

    const jwtToken = jwt.sign({ userId: user._id, email: localEmail }, JWT_SECRET, { expiresIn: expiresIn });

    logger.logLogin(localEmail, ip);
    res.json({ token: jwtToken });
  } catch (err) {
    // console.error(err);
    logger.logError('LaoID login', err, ip);
    res.status(500).json({ message: 'Đăng nhập thất bại' });
  }
});

module.exports = router;
