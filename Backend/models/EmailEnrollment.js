const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  sequenceId: { type: String, required: true, index: true },
}, { timestamps: true });
module.exports = mongoose.model('EmailEnrollment', schema);
