const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String },
    experience_years: { type: Number },
    current_company: { type: String },
    skills: [{ type: String }],
    linkedin_url: { type: String },
    notes: { type: String },
    cv_filename: { type: String },
    cv_url: { type: String },
    status: {
      type: String,
      enum: ["Screening", "Shortlisted", "Rejected"],
      default: "Screening",
    },
    
  },
  { timestamps: true }
);

// ✅ This is the correct export
module.exports = mongoose.model("Candidate", candidateSchema);

