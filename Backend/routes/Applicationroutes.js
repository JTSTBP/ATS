const express = require("express");
const router = express.Router();
const Application = require("../models/Application");



// =======================
// GET ALL APPLICATIONS
// =======================
router.get("/", async (req, res) => {
  try {
    const apps = await Application.find()
      .populate("job_id")
      .populate("candidate_id")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// =======================
// CREATE APPLICATION
// =======================
router.post("/", async (req, res) => {
  try {
    const newApp = await Application.create(req.body);
    res.status(201).json(newApp);
  } catch (err) {
    res.status(500).json({ error: "Failed to create application" });
  }
});

// =======================
// UPDATE APPLICATION
// =======================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update application" });
  }
});

// =======================
// DELETE APPLICATION
// =======================
router.delete("/:id", async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
