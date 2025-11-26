const express = require("express");
const Candidate = require("../models/CandidatesByJob");
const Job = require("../models/Jobs");
const upload = require("../middleware/upload");
const router = express.Router();
const logActivity = require("./logactivity");

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
      .populate({
        path: "jobId",
        select: "title _id clientId",
        populate: {
          path: "clientId",
          select: "companyName"
        }
      })
      .populate({
        path: "interviewStageHistory.updatedBy",
        select: "name email designation",
      })
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
    // Activity Log
    logActivity(
      req.body.createdBy,
      "created",
      "candidate",
      `Created candidate`,
      candidate._id,
      "CandidateByJob"
    );

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
      .populate({
        path: "jobId",
        select: "title _id clientId",
        populate: {
          path: "clientId",
          select: "companyName"
        }
      })
      .populate({
        path: "interviewStageHistory.updatedBy",
        select: "name email designation",
      })
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
      .populate({
        path: "jobId",
        select: "title _id clientId stages", // Added stages
        populate: {
          path: "clientId",
          select: "companyName"
        }
      })
      .populate({
        path: "interviewStageHistory.updatedBy",
        select: "name email designation",
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, candidates });
  } catch (error) {
    console.error("Error fetching candidates by job:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch candidates by job" });
  }
});

// ... existing update route ...

// 🔁 Update candidate status only
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, role, interviewStage, stageStatus, stageNotes } = req.body;

    // Debug logging
    console.log('📋 Status Update Request:', {
      status,
      role,
      interviewStage,
      stageStatus,
      stageNotes,
      willAddToHistory: status === "Interviewed" && interviewStage && stageStatus
    });

    const updateData = { status, UpdatedStatusBy: role };

    // If moving to an interview stage, update the current stage
    if (interviewStage !== undefined) {
      updateData.interviewStage = interviewStage;
    }

    // If stage status and notes are provided, add to history
    if (status === "Interviewed" && interviewStage && stageStatus) {
      const stageHistoryEntry = {
        stageName: interviewStage,
        status: stageStatus,
        notes: stageNotes || "",
        updatedBy: role,
        timestamp: new Date(),
      };

      console.log('✅ Adding to interviewStageHistory:', stageHistoryEntry);

      updateData.$push = {
        interviewStageHistory: stageHistoryEntry,
      };
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Activity Log
    logActivity(
      role,
      "updated",
      "candidate-status",
      `Updated candidate status to "${status}"${interviewStage ? ` (${interviewStage} - ${stageStatus || "N/A"})` : ""}`,
      req.params.id,
      "CandidateByJob"
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
router.delete("/:id/:role", async (req, res) => {
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
    // Activity Log
    logActivity(
      req.params.role,
      "deleted",
      "candidate",
      `Deleted candidate`,
      req.params.id,
      "CandidateByJob"
    );

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
