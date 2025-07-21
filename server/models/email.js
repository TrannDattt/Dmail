const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmailSchema = new Schema({
  from: String,
  to: String,
  subject: String,
  body: String,
  attachments: [
    {
      filename: String,
      path: String,
      mimetype: String
    }
  ],
  folder: String,
  date: Date
});

module.exports = mongoose.model('Email', EmailSchema);