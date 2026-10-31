const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  reason: { type: String, enum: ['declined', 'unsubscribed', 'bounced', 'manual'], required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('EmailSuppression', schema);
