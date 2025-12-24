const mongoose = require('mongoose');

const pocSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    altPhone: { type: String },
    linkedinUrl: { type: String }
});

const clientSchema = new mongoose.Schema(
    {
        companyName: { type: String, required: true, unique: true },
        websiteUrl: { type: String, required: true, unique: true },
        industry: { type: String },
        linkedinUrl: { type: String },
        companyInfo: { type: String },
        logo: { type: String, required: true }, // Profile picture/logo path
        address: { type: String },
        state: { type: String },
        agreementPercentage: { type: Number },
        gstNumber: { type: String },
        pocs: [pocSchema],
        jobCount: { type: Number, default: 0 },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
