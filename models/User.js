const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  airtableId: String,
  accessToken: String,
  refreshToken: String,
  profile: Object,
  lastLoginAt: Date
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
