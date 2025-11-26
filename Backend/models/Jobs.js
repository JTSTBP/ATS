const mongoose = require("mongoose");

const candidateFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  fixed: { type: Boolean, default: false },
  options: { type: [String], default: [] },
});

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  responsible: { type: String, default: "Recruiter" },
  mandatory: { type: Boolean, default: true },
});

const jobSchema = new mongoose.Schema(
  {
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    title: { type: String, required: true },
    description: { type: String },
    department: { type: String },
    location: [{ name: String, tier: String }],
    employmentType: { type: String, default: "Full-time" },
    status: { type: String, default: "Open" },

    keySkills: [String],

    salary: {
      min: { type: String },
      max: { type: String },
      currency: { type: String, default: "USD" },
    },

    experience: {
      min: { type: String },
      max: { type: String },
      unit: { type: String, default: "years" },
    },

    industry: { type: String },
    functionalArea: { type: String },
    education: [String],
    requirements: { type: String },
    candidateCount: { type: Number, default: 0 },

    stages: [stageSchema],
    screeningQuestions: [String],
    teamMembers: [String],

    assignedRecruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    leadRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    candidateFields: [candidateFieldSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
