const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const attachClientInfo = require('./middleware/attachClientInfo');

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost',
//   credentials: true
}));
app.use(attachClientInfo);

const authRoutes = require('./api/auth_api');
const emailRoutes = require('./api/mail_api');

// app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

mongoose.connect(process.env.MONGO_URL, 
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(3001, () => console.log('API running on port 3001'));
