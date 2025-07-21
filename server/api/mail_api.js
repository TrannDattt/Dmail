const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const Email = require('../models/email');
const auth = require('../middleware/auth_middleware');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { simpleParser } = require('mailparser');
const { getImapClient } = require('../utils/imapClientFactory');
const axios = require('axios');
const fs = require('fs');
const { Readable } = require('stream');
const logger = require('../utils/logging');

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL;

const normalizeFolder = (folder) => {
  const lower = folder.toLowerCase();
  switch (lower) {
    case 'inbox': return 'INBOX';
    case 'sent': return 'Sent';
    case 'drafts': return 'Drafts';
    case 'trash': return 'Trash';
    default: return folder;
  }
};

const uploadPath = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  host: 'mail.local', 
  port: 587,  
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS 
  },
  tls: {
    rejectUnauthorized: false 
  }
});

// Gửi email
router.post('/send', auth, upload.array('attachments'), async (req, res) => {
  const { to, subject, body } = req.body;
  const { ip } = req.clientInfo;
  const from = req.user.email;
  const username = from.split('@')[0];

  const rawFiles = Array.isArray(req.files) ? req.files : [];

  const attachments = rawFiles.map(file => {
    const fullPath = path.resolve(uploadPath, file.filename);
    const fileData = fs.readFileSync(fullPath);

    return {
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      content: fileData.toString('base64'),
      encoding: 'base64',
      mimetype: file.mimetype
    };
  });

  const safeBody = typeof body === 'string' ? body : '';

  const mailOptions = {
    from: `"You" <${from}>`,
    to,
    subject,
    alternatives: [
      {
        contentType: 'text/plain; charset=utf-8',
        content: safeBody
      },
      {
        contentType: 'text/html; charset=utf-8',
        content: `<p>${safeBody.replace(/\n/g, '<br>')}</p>`
      }
    ],
    attachments
  };
  
  try {
    // Gửi mail
    const info = await transporter.sendMail(mailOptions);

    // Lưu vào MongoDB
    await Email.create({
      from,
      to,
      subject,
      safeBody,
      attachments,
      folder: 'sent',
      date: new Date()
    });

    await axios.post(`${MAIL_SERVER_URL}/mails/send`, {
      mailOptions: {
        ...mailOptions,
        attachments
      },
      username
    });

    // logger.logReceive(to, subject, ip);
    logger.logSend(from, subject, ip);
    res.json({ message: 'Gửi mail thành công' });
  } catch (err) {
    // console.error('Lỗi gửi mail:', err);
    logger.logError('Send email', err, ip);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:folder', auth, async (req, res) => {
  try {
    const email = req.user.email;
    const folder = normalizeFolder(req.params.folder);
    const client = await getImapClient(email);

    // Mở thư mục tương ứng
    const mailbox = await client.mailboxOpen(folder);
    // console.log('Mailbox info:', mailbox);

    if (mailbox.exists === 0) {
      await client.logout();
      return res.json([]);
    }

    if (!mailbox.exists) {
      await client.logout();
      return res.status(404).json({ error: `Thư mục ${folder} không tồn tại` });
    }

    const emails = [];

    for await (let msg of client.fetch('1:*', {
      envelope: true,
      flags: true,
      source: false
    })) {
      emails.push({
        uid: msg.uid,
        subject: msg.envelope.subject,
        from: msg.envelope.from?.map(f => f.address).join(', '),
        to: msg.envelope.to?.map(t => t.address).join(', '),
        date: msg.envelope.date,
        flags: msg.flags
      });
    }

    await client.logout();
    res.json(emails.reverse());
  } catch (err) {
    console.error('Lỗi IMAP:', err);
    res.status(500).json({ error: 'Không thể lấy email từ thư mục này' });
  }
});

router.get('/detail/:folder/:uid', auth, async (req, res) => {
  const { folder, uid } = req.params;
  const normalizedFolder = normalizeFolder(folder);
  const email = req.user.email;

  let client;

  try {
    client = await getImapClient(email);
    await client.mailboxOpen(normalizedFolder);

    const messages = client.fetch({ uid: Number(uid) }, { source: true });

    let messageFound = false;
    for await (let msg of messages) {
      const parsed = await simpleParser(msg.source);

      res.json({
        subject: parsed.subject || '',
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        date: parsed.date,
        body: parsed.text,
        html: parsed.html,
        attachments: parsed.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size
        }))
      });
      messageFound = true;
    }

    if (!messageFound) {
      res.status(404).json({ error: 'Không tìm thấy email với UID này' });
    }
  } catch (err) {
    console.error('Lỗi đọc email chi tiết:', err);
    res.status(500).json({ error: 'Không thể đọc email' });
  } finally {
    await client.logout();
  }
});

router.get('/download/:folder/:uid/:filename', auth, async (req, res) => {
  const { folder, uid, filename } = req.params;
  const normalizedFolder = normalizeFolder(folder);
  const email = req.user.email;

  let client;

  try {
    client = await getImapClient(email);
    await client.mailboxOpen(normalizedFolder);

    const messages = client.fetch({ uid: Number(uid) }, { source: true });

    for await (let msg of messages) {
      const parsed = await simpleParser(msg.source);

      const attachment = parsed.attachments.find(att => att.filename === filename);

      if (!attachment) continue;

      console.log(`Sending file: ${attachment.filename}, size: ${attachment.content.length} bytes`);

      const stream = new Readable();
      stream.push(attachment.content);
      stream.push(null);

      res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);

      // Stream xong thì logout client
      stream.on('end', async () => {
        try {
          await client.logout();
        } catch (e) {
          console.error('Lỗi khi logout IMAP:', e);
        }
      });

      stream.pipe(res);
      return;
    }

    res.status(404).json({ error: 'Không tìm thấy file đính kèm' });

  } catch (err) {
    console.error('Lỗi khi tải file đính kèm từ IMAP:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi khi tải file' });
    }
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        console.error('Lỗi khi logout IMAP:', e);
      }
    }
  }
});

router.get('/preview/:folder/:uid/:filename', auth, async (req, res) => {
  const { folder, uid, filename } = req.params;
  const normalizedFolder = normalizeFolder(folder);
  const email = req.user.email;

  let client;

  try {
    client = await getImapClient(email);
    await client.mailboxOpen(normalizedFolder);

    const messages = client.fetch({ uid: Number(uid) }, { source: true });

    let found = false;

    for await (let msg of messages) {
      const parsed = await simpleParser(msg.source);

      const attachment = parsed.attachments.find(att => att.filename === filename);
      if (!attachment) continue;

      res.setHeader('Content-Type', attachment.contentType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
      res.send(attachment.content);
      found = true;
      break;
    }

    if (!found) {
      res.status(404).json({ error: 'Không tìm thấy file đính kèm' });
    }
  } catch (err) {
    console.error('Lỗi khi xem trước file đính kèm từ IMAP:', err);
    res.status(500).json({ error: 'Lỗi khi xem file' });
  } finally {
    await client.logout();
  }
});

router.post('/search', auth, async (req, res) => {
  const { from, subject, body, date, folder = 'INBOX' } = req.body;
  const normalizedFolder = normalizeFolder(folder);
  const email = req.user.email;

  let client;

  try {
    client = await getImapClient(email);
    await client.mailboxOpen(normalizedFolder);

    const uids = await client.search({});

    if (uids.length === 0) {
      return res.json([]);
    }

    const emails = [];

    for await (let msg of client.fetch(uids, { envelope: true, source: true })) {
      const parsed = await simpleParser(msg.source);

      const matches =
        (!from || (parsed.from?.text || '').toLowerCase().includes(from.toLowerCase())) &&
        (!subject || (parsed.subject || '').toLowerCase().includes(subject.toLowerCase())) &&
        (!body || (parsed.text || '').toLowerCase().includes(body.toLowerCase())) &&
        (!date || isSameDay(new Date(parsed.date), new Date(date)));

      if (matches) {
        emails.push({
          uid: msg.uid,
          subject: parsed.subject || '',
          from: parsed.from?.text || '',
          to: parsed.to?.text || '',
          date: parsed.date,
          snippet: (parsed.text || '').slice(0, 200),
          hasAttachments: parsed.attachments?.length > 0
        });
      }
    }

    res.json(emails.reverse());
  } catch (err) {
    console.error('Lỗi tìm kiếm IMAP:', err);
    res.status(500).json({ error: 'Không thể tìm kiếm email' });
  } finally {
    await client.logout();
  }
});

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

module.exports = router;