const express = require('express');
const router = express.Router();
const { spawnSync } = require('child_process');

const SMTP_USER = 'admin';
const SMTP_PASS = '12345';

router.post('/internal/create-user', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Missing username or password' });

  try {
    // 1. Tạo user
    spawnSync('useradd', ['-m', '-s', '/bin/bash', username]);

    // 2. Đặt mật khẩu
    spawnSync('chpasswd', [], {
      input: `${username}:${password}`,
    });
    console.log(`Creating Linux user: ${username} with password: ${password}`);

    // 3. Tạo thư mục Maildir
    const base = `/home/${username}/Maildir`;
    const subFolders = [
      'cur', 'new', 'tmp',
      '.Sent/cur', '.Sent/new', '.Sent/tmp',
      '.Drafts/cur', '.Drafts/new', '.Drafts/tmp',
      '.Trash/cur', '.Trash/new', '.Trash/tmp'
    ];

    for (const folder of subFolders) {
      spawnSync('mkdir', ['-p', `${base}/${folder}`]);
    }

    // 4. Chỉnh quyền
    spawnSync('chown', ['-R', `${username}:${username}`, base]);
    spawnSync('setfacl', ['-R', '-m', 'u:admin:rwx', base]);
    spawnSync('setfacl', ['-R', '-d', '-m', 'u:admin:rwx', base]);

    // logger.logCreateUser(username);
    return res.status(200).json({ message: `User ${username} created` });
  } catch (err) {
    // logger.logError(username, err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

module.exports = router;
