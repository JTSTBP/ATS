const express = require("express");
const Job = require("../models/Jobs");
const logActivity = require("./logactivity");
const Client = require("../models/Client");

const router = express.Router();

// ➕ Create a new job
router.post("/", async (req, res) => {
  try {
    const jobData = { ...req.body };
    delete jobData._id; // <-- remove _id if sent accidentally

    const newJob = new Job(jobData);
    await newJob.save();

    // Increment client's job count if clientId is provided
    if (newJob.clientId) {

      await Client.findByIdAndUpdate(newJob.clientId, {
        $inc: { jobCount: 1 }
      });
    }

    logActivity(
      req.body.CreatedBy, // userId
      "created", // action
      "job", // module
      `Created job ${newJob.title}`, // description
      newJob._id, // targetId
      "Job" // targetModel
    );
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create job. Please check all required fields.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email")
      .populate("CreatedBy", "name email")
      .populate("clientId", "companyName websiteUrl industry linkedinUrl companyInfo pocs logo")
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
      .populate("clientId", "companyName websiteUrl industry linkedinUrl companyInfo pocs logo")
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

// 🎯 Get jobs assigned to a specific recruiter
router.get("/assigned/:recruiterId", async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const jobs = await Job.find({ assignedRecruiters: recruiterId })
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email")
      .populate("CreatedBy", "name email")
      .populate("clientId", "companyName websiteUrl industry linkedinUrl companyInfo pocs logo")
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching assigned jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned jobs",
    });
  }
});

// 🧾 Get Single Job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("assignedRecruiters", "name email")
      .populate("leadRecruiter", "name email")
      .populate("clientId", "companyName websiteUrl industry linkedinUrl companyInfo pocs logo")

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
    const oldJob = await Job.findById(req.params.id);
    if (!oldJob) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    // Handle Client Job Count Update
    if (req.body.clientId && req.body.clientId !== (oldJob.clientId?.toString())) {
      // Decrement count for old client
      if (oldJob.clientId) {
        await Client.findByIdAndUpdate(oldJob.clientId, {
          $inc: { jobCount: -1 }
        });
      }
      // Increment count for new client
      await Client.findByIdAndUpdate(req.body.clientId, {
        $inc: { jobCount: 1 }
      });
    } else if (req.body.clientId === "" && oldJob.clientId) {
      // If client is removed
      await Client.findByIdAndUpdate(oldJob.clientId, {
        $inc: { jobCount: -1 }
      });
    }
    logActivity(
      req.body.UpdatedBy, // userId (you must send updatedBy from frontend)
      "updated", // action
      "job", // module
      `Updated job ${updatedJob.title}`, // description
      updatedJob._id, // targetId
      "Job" // targetModel
    );
    res.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
});

// ❌ Delete a job
router.delete("/:id/:role", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    logActivity(
      req.params.role, // userId (role param actually contains userId)
      "deleted", // action
      "job", // module
      `Deleted job`, // description
      req.params.id, // targetId
      "Job" // targetModel
    );
    res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
});

module.exports = router;
