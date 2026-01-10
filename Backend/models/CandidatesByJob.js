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
        "Shortlisted",
        "Interviewed",
        "Selected",
        "Joined",
        "Rejected",
      ],
      default: "New",
    },
    joiningDate: {
      type: Date,
    },
    dynamicFields: {
      type: Object,
      default: {},
    },
    interviewStage: {
      type: String,
      default: null,
    },
    interviewStageHistory: [
      {
        stageName: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["Selected", "Rejected"],
          required: true,
        },
        notes: {
          type: String,
          default: "",
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          default: "",
        },
        joiningDate: {
          type: Date,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CandidateByJob", candidateSchema);
