const express = require('express');
const app = express();
const userRouter = require('./api/user_api');
const mailRouter = require('./api/mail_api');
const axios = require('axios');

const SERVER_API = 'http://server:3001/api/all-users';

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(express.json());
app.use('/', userRouter);
app.use('/mails', mailRouter);

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Mail-server API running on port ${PORT}`);
});

(async () => {
  try {
    const response = await axios.get(SERVER_API);

    console.log(response.data.message);
  } catch (error) {
    console.error('[SYNC USERS ERROR]', error.response?.data || error.message);
  }
})();

