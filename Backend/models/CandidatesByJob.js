const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    UpdatedStatusBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeUrl: String,
    linkedinUrl: String,
    portfolioUrl: String,
    notes: String,
    status: {
      type: String,
      enum: [
        "New",
        "Screened",
        "Shortlisted",
        "Interview",
        "Offered",
        "Hired",
        "Rejected",
      ],
      default: "New",
    },
    dynamicFields: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CandidateByJob", candidateSchema);
