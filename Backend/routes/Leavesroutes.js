const express = require("express");
const LeaveApplication = require("../models/Leaves");
const User = require("../models/Users");
const logActivity = require("./logactivity");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "name email reporter designation",
        populate: {
          path: "reporter",
          select: "name email role", // add fields you need
        },
      })
      .populate("reporter", "name designation");
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📩 Apply for Leave
router.post("/apply", async (req, res) => {
  try {
    const { user, leaveType, fromDate, toDate, reason, reporter } = req.body;

    const usergiv = await User.findById(user);
    if (!usergiv) return res.status(404).json({ message: "User not found" });

    const leave = new LeaveApplication({
      user,
      leaveType,
      fromDate,
      toDate,
      reason,
      reporter,
    });

    await leave.save();
    logActivity(
      user,
      "Apply Leave",
      "Leave Management",
      `${usergiv.name} applied for ${leaveType} from ${fromDate} to ${toDate}`,
      leave._id,
      "LeaveApplication"
    );

    res.status(201).json({ message: "Leave application submitted", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      user: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .populate("reporter", "name designation");
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📄 Get all leaves of a user
router.get("/user/:userId", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      user: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .populate("reporter", "name designation");
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// 🧾 Get leaves assigned to a reporter (Manager/HR)
router.get("/reporter/:reporterId", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      "reporter._id": req.params.reporterId,
    }).sort({
      createdAt: -1,
    });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Update leave status (Approve/Reject)
router.put("/:leaveId/status", async (req, res) => {
  try {
    const { status, role } = req.body;
    const leave = await LeaveApplication.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = status;
    leave.statusUpdated = role;
    const leaveapply = await User.findOne({ _id: leave.user });
    await leave.save();
    logActivity(
      role, // userId (admin/HR)
      "Update Leave Status", // action
      "Leave Management", // module
      `Leave request by user ${leaveapply.name} was updated to "${status}"`, // description
      leave._id, // targetId
      "LeaveApplication" // targetModel
    );

    res
      .status(200)
      .json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// 🧑‍💼 Get all possible reporters (for dropdown)
router.get("/reporters", async (req, res) => {
  try {
    const reporters = await User.find({
      designation: { $in: ["Manager", "HR"] },
    })
      .select("_id name email designation")
      .sort({ name: 1 });

    res.status(200).json(reporters);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
