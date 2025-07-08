const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const mongoose = require('mongoose');
const Email = require('../models/email');
const auth = require('../middleware/auth_middleware');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Gửi email
router.post('/send', auth, upload.array('attachments'), async (req, res) => {
  const { to, subject, body } = req.body;
  const from = req.user.email;

  const attachments = req.files.map(file => ({
    filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype
  }));

  try {
    await transporter.sendMail({
      from: `"You" <${from}>`,
      to,
      subject,
      alternatives: [
        {
          contentType: 'text/plain; charset=utf-8',
          content: body
        },
        {
          contentType: 'text/html; charset=utf-8',
          content: `<p>${body.replace(/\n/g, '<br>')}</p>`
        }
      ],
      attachments: req.files.map(file => ({
        filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        path: file.path,
        contentType: file.mimetype
      }))
    });

    await Email.create({
      from,
      to,
      subject,
      body,
      attachments,
      folder: 'sent',
      date: new Date()
    });

    res.json({ message: 'Gửi mail thành công' });
  } catch (err) {
    console.error('Lỗi gửi mail:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const emails = await Email.find({ userId }).sort({ date: -1 });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: 'Không thể tải email' });
  }
});


// Lấy email
router.get('/:folder', auth, async (req, res) => {
  const folder = req.params.folder.toLowerCase();
  const email = req.user.email;

  let filter = {};

  if (folder === 'inbox') {
    filter.to = email;
  } else if (folder === 'sent') {
    filter.from = email;
  } else {
    return res.status(400).json({ error: 'Thư mục không hợp lệ' });
  }

  try {
    const emails = await Email.find(filter).sort({ date: -1 });
    res.json(emails);
  } catch (err) {
    console.error('Lỗi truy vấn email:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.get('/detail/:id', auth, async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ error: 'Không tìm thấy email' });
    res.json(email);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

const uploadsDir = path.join(__dirname, '../uploads');

router.get('/download/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/search', auth, async (req, res) => {
  const { from, subject, body, date } = req.body;
  const email = req.user.email;

  const filter = {
    to: email
  };

  if (from) {
    filter.from = { $regex: from, $options: 'i' };
  }

  if (subject) {
    filter.subject = { $regex: subject, $options: 'i' };
  }

  if (body) {
    filter.body = { $regex: body, $options: 'i' };
  }

  if (date) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    filter.date = { $gte: targetDate, $lt: nextDate };
  }

  try {
    const emails = await Email.find(filter).sort({ date: -1 });
    res.json(emails);
  } catch (err) {
    console.error('Lỗi tìm kiếm email:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
