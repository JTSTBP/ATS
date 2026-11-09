const mongoose = require('mongoose');
const ping = new mongoose.Schema({ from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, message: { type: String, required: true, maxlength: 500 }, at: { type: Date, default: Date.now }, readAt: Date });
const schema = new mongoose.Schema({
 recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
 breakUntil: Date, breakStartedAt: Date, breakBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 lastNudgeAt: Date,
 acknowledgements: { type: Map, of: new mongoose.Schema({ until: Date, activityAt: String }, { _id: false }), default: {} },
 pings: { type: [ping], default: [] },
}, { timestamps: true });
module.exports = mongoose.model('SupervisorState', schema);
