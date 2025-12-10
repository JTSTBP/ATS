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
        select: "title _id clientId stages candidateFields",
        populate: {
          path: "clientId",
          select: "companyName pocs"
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
          select: "companyName pocs"
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

// 📧 Send Candidate Email (Supports Multiple)
router.post("/send-email", async (req, res) => {
  const { senderEmail, appPassword, recipientEmails, ccEmails, candidateIds } = req.body;

  if (!senderEmail || !appPassword || !recipientEmails || !candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ success: false, message: "Missing required fields or invalid candidate IDs" });
  }

  try {
    const candidates = await Candidate.find({ _id: { $in: candidateIds } }).populate({
      path: "jobId",
      select: "title"
    });

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ success: false, message: "No candidates found" });
    }

    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    let htmlContent = "";
    let subject = "";

    if (candidates.length === 1) {
      const candidate = candidates[0];
      const dynamicFields = candidate.dynamicFields || {};
      subject = `Candidate Profile: ${dynamicFields.candidateName || "Candidate"} - ${candidate.jobId?.title}`;

      let tableRows = "";
      for (const [key, value] of Object.entries(dynamicFields)) {
        tableRows += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value || "N/A"}</td>
          </tr>
        `;
      }

      htmlContent = `
        <h3>Candidate Profile: ${dynamicFields.candidateName || "Candidate"}</h3>
        <p><strong>Position:</strong> ${candidate.jobId?.title || "N/A"}</p>
        <br/>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Field</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <br/>
        <p>Regards,</p>
      `;
    } else {
      const jobTitle = candidates[0].jobId?.title || "the position";
      subject = `Candidate Profiles (${candidates.length}) - ${jobTitle}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #2c3e50;">Candidate Profiles Shared</h2>
          <p>Hello,</p>
          <p>We are pleased to share the profiles of the following candidates for the position of <strong>${jobTitle}</strong>.</p>
          <p>Please review the summary of candidates below:</p>
          <br/>
      `;

      // Collect all unique keys from dynamicFields
      const allKeys = new Set();
      candidates.forEach(c => {
        if (c.dynamicFields && typeof c.dynamicFields === 'object') {
          Object.keys(c.dynamicFields).forEach(k => {
            if (k && k.trim() !== '' && k.toLowerCase() !== 'undefined' && k.toLowerCase() !== 'null') {
              allKeys.add(k);
            }
          });
        }
      });

      // Prioritize 'candidateName' if it exists, otherwise just use the keys
      let headers = Array.from(allKeys);
      if (headers.includes('candidateName')) {
        headers = ['candidateName', ...headers.filter(h => h !== 'candidateName')];
      }

      // Build Table Header
      let headerHtml = '<tr style="background-color: #f8f9fa;">';
      // Add Position column
      headerHtml += '<th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; color: #495057;">Position</th>';

      headers.forEach(key => {
        // Capitalize first letter for better display
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
        headerHtml += `<th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; color: #495057;">${displayKey}</th>`;
      });
      headerHtml += '</tr>';

      // Build Table Body
      let bodyHtml = '';
      candidates.forEach(candidate => {
        const dynamicFields = candidate.dynamicFields || {};
        bodyHtml += '<tr>';

        // Position Data
        bodyHtml += `<td style="padding: 10px; border: 1px solid #dee2e6;">${candidate.jobId?.title || "N/A"}</td>`;

        // Dynamic Fields Data
        headers.forEach(key => {
          bodyHtml += `<td style="padding: 10px; border: 1px solid #dee2e6;">${dynamicFields[key] || "N/A"}</td>`;
        });
        bodyHtml += '</tr>';
      });

      htmlContent += `
        <div style="overflow-x: auto;">
          <table style="border-collapse: collapse; width: 100%; border: 1px solid #dee2e6; font-size: 14px;">
            <thead>
              ${headerHtml}
            </thead>
            <tbody>
              ${bodyHtml}
            </tbody>
          </table>
        </div>
        <br/>
        <p>Please let us know your feedback or if you would like to proceed with any of these candidates.</p>
        <br/>
        <p>Best Regards,</p>
        <p><strong>Recruitment Team</strong></p>
        </div>
      `;
    }

    const path = require('path');
    const fs = require('fs');
    const attachments = [];

    candidates.forEach(candidate => {
      if (candidate.resumeUrl) {
        // Check if resumeUrl is a valid server path (not a blob or http url)
        if (candidate.resumeUrl.startsWith('blob:') || candidate.resumeUrl.startsWith('http')) {
          console.warn(`Skipping invalid resume URL for candidate ${candidate._id}: ${candidate.resumeUrl}`);
          return;
        }

        // resumeUrl is stored as /uploads/resumes/filename
        // We need to resolve it to the absolute path on the server
        // Assuming the server is running in Backend/ and uploads are in Backend/uploads
        const absolutePath = path.join(__dirname, '..', candidate.resumeUrl);

        if (fs.existsSync(absolutePath)) {
          // Extract filename for the attachment
          const filename = path.basename(absolutePath);

          attachments.push({
            filename: filename,
            path: absolutePath
          });
        } else {
          console.warn(`Resume file not found for candidate ${candidate._id}: ${absolutePath}`);
        }
      }
    });

    const mailOptions = {
      from: senderEmail,
      to: recipientEmails,
      cc: ccEmails,
      subject: subject,
      html: htmlContent,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email. Check credentials." });
  }
});

module.exports = router;
