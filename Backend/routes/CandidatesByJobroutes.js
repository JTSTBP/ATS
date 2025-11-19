const express = require("express");
const Candidate = require("../models/CandidatesByJob");
const Job = require("../models/Jobs");
const upload = require("../middleware/upload");
const router = express.Router();


// 🔵 Get all candidates
router.get("/", async (req, res) => {
  try {
   const candidates = await Candidate.find()
     .populate({
       path: "createdBy",
       select: "name email reporter designation",
       populate: {
         path: "reporter",
         select: "name email role", // add fields you need
       },
     })
     .populate("jobId", "title _id")
     .sort({ createdAt: -1 });

    res.json({ success: true, candidates });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch candidates" });
  }
});

// 🟢 Create a new candidate
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const parsedFields = req.body.dynamicFields
      ? JSON.parse(req.body.dynamicFields)
      : {};

    const resumePath = req.file
      ? `/uploads/resumes/${req.file.filename}`
      : null;

    const candidate = new Candidate({
      jobId: req.body.jobId,
      createdBy: req.body.createdBy,
      linkedinUrl: req.body.linkedinUrl,
      portfolioUrl: req.body.portfolioUrl,
      notes: req.body.notes,
      dynamicFields: parsedFields,
      resumeUrl: resumePath,
    });

    await candidate.save();

    if (req.body.jobId) {
      await Job.findByIdAndUpdate(
        req.body.jobId,
        { $inc: { candidateCount: 1 } },
        { new: true }
      );
    }

    res.json({ success: true, candidate });
  } catch (error) {
    console.error("Error creating candidate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create candidate",
    });
  }
});


// GET /api/CandidatesJob/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const candidates = await Candidate.find({
      createdBy: req.params.userId,
    })
      .populate("createdBy", "name email")
      .populate("jobId", "title _id")
    .sort({ createdAt: -1 });
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// 🟣 Get candidates by jobId
router.get("/job/:jobId", async (req, res) => {
  try {
    const candidates = await Candidate.find({ jobId: req.params.jobId })
      .populate("createdBy", "name email")
      .populate("jobId", "title _id")
      .sort({ createdAt: -1 });
    res.json({ success: true, candidates });
  } catch (error) {
    console.error("Error fetching candidates by job:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch candidates by job" });
  }
});

// ✏️ Update a candidate
router.put("/:id", upload.single("resume"), async (req, res) => {
  try {
    const parsedFields = req.body.dynamicFields
      ? JSON.parse(req.body.dynamicFields)
      : {};

    const updateData = {
      jobId: req.body.jobId,
      createdBy: req.body.createdBy,
      linkedinUrl: req.body.linkedinUrl,
      portfolioUrl: req.body.portfolioUrl,
      notes: req.body.notes,
      dynamicFields: parsedFields,
    };

    if (req.file) {
      updateData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, candidate: updatedCandidate });
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
});


// 🔁 Update candidate status only
router.patch("/:id/status", async (req, res) => {
  try {
    const { status,role } = req.body;
    
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status, UpdatedStatusBy: role },
      { new: true }
    );
    res.json({ success: true, candidate: updatedCandidate });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
});

// ❌ Delete candidate
router.delete("/:id", async (req, res) => {
  try {
    // 1. Find the candidate first
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const jobId = candidate.jobId; // store jobId before deletion

    // 2. Delete the candidate
    await Candidate.findByIdAndDelete(req.params.id);

    // 3. Decrease candidate count in the corresponding job
    if (jobId) {
      await Job.findByIdAndUpdate(
        jobId,
        { $inc: { candidateCount: -1 } },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete candidate",
    });
  }
});


module.exports = router;
