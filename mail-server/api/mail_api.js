const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mailcomposer = require('nodemailer/lib/mail-composer');
// const logger = require('../../server/utils/logging');

router.post('/send', async (req, res) => {
  const { mailOptions, username } = req.body;

  if (!mailOptions || !username) {
    return res.status(400).json({ error: 'Thiếu mailOptions hoặc username' });
  }

  const sentDir = `/home/${username}/Maildir/.Sent/new`;
  const filename = `${Date.now()}.eml`;

  if (Array.isArray(mailOptions.attachments)) {
    mailOptions.attachments = mailOptions.attachments.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.mimetype
    }));
  }

  const composer = new mailcomposer(mailOptions);
  composer.compile().build((err, message) => {
    if (err) {
      // logger.logError('Send email', e, ip);
      // console.error('Lỗi tạo MIME:', err);
      return res.status(500).json({ error: 'Lỗi tạo MIME' });
    }

    try {
      fs.writeFileSync(path.join(sentDir, filename), message);
      res.json({ message: 'Lưu mail vào Sent thành công' });
    } catch (e) {
      // console.error('Lỗi ghi file Sent:', e);
      // logger.logError('Send email', e, ip);
      res.status(500).json({ error: 'Không ghi được vào thư mục Sent' });
    }
  });
});

module.exports = router;
