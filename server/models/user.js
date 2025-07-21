const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  imapPass: String,
  username: String,
  dob: Date,
  phone: String,
  country: String,
  avatar: String,
});

module.exports = mongoose.model('User', UserSchema);
