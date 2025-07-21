const { ImapFlow } = require('imapflow');
const { decrypt } = require('./crypto');
const User = require('../models/user');

async function getImapClient(email) {
  const user = await User.findOne({ email });
  if (!user || !user.imapPass) {
    throw new Error('Không tìm thấy thông tin IMAP');
  }

  const username = email.split('@')[0];
  const imapPassword = decrypt(user.imapPass);

  const client = new ImapFlow({
    host: 'mailserver',
    port: 143,
    secure: false,
    auth: {
      user: username,
      pass: imapPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  return client;
}

module.exports = { getImapClient };
