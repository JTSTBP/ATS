const mongoose = require('mongoose');
// Retain this record after completion, stopping, or failure: each client may contact an address once.
const schema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sequenceId: { type: String, required: true, unique: true },
  sequenceName: { type: String, required: true },
  state: { type: String, enum: ['preparing', 'queued', 'stopped', 'failed'], default: 'preparing' },
}, { timestamps: true });
schema.index({ clientId: 1, email: 1 }, { unique: true });
module.exports = mongoose.model('ClientEmailDispatch', schema);
