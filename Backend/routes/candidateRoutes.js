const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const Candidate = require("../models/Candidate");
const Application = require("../models/Application"); // ⭐ IMPORTANT

// 🗂️ Setup multer for CV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// 📥 CREATE Candidate + Application
router.post("/", upload.single("cv"), async (req, res) => {
  try {
    const data = req.body;

    // 🔍 Check duplicate email
    const existing = await Candidate.findOne({ email: data.email });
    if (existing) {
      return res.status(400).json({
        message: "Candidate with this email already exists",
      });
    }

    // CREATE CANDIDATE
    const newCandidate = new Candidate({
      ...data,
      status: data.status || "Screening",
      skills: data.skills ? data.skills.split(",").map((s) => s.trim()) : [],
      cv_filename: req.file ? req.file.filename : null,
      cv_url: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await newCandidate.save();

    // ⭐ CREATE APPLICATION
    const newApplication = await Application.create({
      candidate_id: newCandidate._id,
      job_id: null,
      status: newCandidate.status,
      priority: "Medium",
    });

    console.log("🔥 APPLICATION CREATED:", newApplication._id);

    return res.status(201).json(newCandidate);

  } catch (err) {
    console.error("❌ ERROR CREATING CANDIDATE OR APPLICATION:", err);
    return res.status(500).json({ message: "Error adding candidate" });
  }
});


// 📜 GET All Candidates
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching candidates" });
  }
});


// ✏️ UPDATE Candidate
router.put("/:id", upload.single("cv"), async (req, res) => {
  try {
    const data = req.body;

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        status: data.status || "Screening",
        skills: data.skills ? data.skills.split(",").map((s) => s.trim()) : [],
        ...(req.file && {
          cv_filename: req.file.filename,
          cv_url: `/uploads/${req.file.filename}`,
        }),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating candidate" });
  }
});


// 🗑️ DELETE Candidate + Applications
router.delete("/:id", async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ candidate_id: req.params.id });

    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting candidate" });
  }
});

module.exports = router;
