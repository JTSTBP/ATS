const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  steps: [{ subject: { type: String, required: true }, body: { type: String, required: true } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
module.exports = mongoose.model('ClientEmailSequence', schema);
