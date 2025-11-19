const express = require("express");
const Job = require("../models/Jobs");

const router = express.Router();

// ➕ Create a new job
router.post("/", async (req, res) => {
  try {
    const jobData = { ...req.body };
    delete jobData._id; // <-- remove _id if sent accidentally

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({
      success: false,
      message: `${error._message} Please fill all feilds`,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email")
      .populate("CreatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
});

// 📋 Get all jobs created by a specific user (CreatedBy)
router.get("/createdby/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const jobs = await Job.find({ CreatedBy: userId })
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email")
      .populate("CreatedBy", "name email")
      .sort({ createdAt: -1 });

    if (!jobs.length) {
      return res.status(404).json({
        success: false,
        message: "No jobs found for this user",
      });
    }

    res.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs by creator:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs by CreatedBy",
    });
  }
});

// 🧾 Get Single Job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email");

    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
});

// ✏️ Update a job
router.put("/:id", async (req, res) => {
  try {
    console.log(req.body, "uuu");
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
});

// ❌ Delete a job
router.delete("/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
});

module.exports = router;
