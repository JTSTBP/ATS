const express = require("express");
const User = require("../models/Users");
const ActivityLog = require("../models/activitylog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUpload");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Populate reporter details when fetching user
    const user = await User.findOne({ email })
      .select("+password")
      .populate("reporter", "name email designation"); // specify fields to include

    if (!user)
      return res.status(400).json({ message: "User not found or wrong role" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        appPassword: user.appPassword,
        reporter: user.reporter // populated reporter info
          ? {
            _id: user.reporter._id,
            name: user.reporter.name,
            email: user.reporter.email,
            designation: user.reporter.designation,
          }
          : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.get("/activity-logs", async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("userId", "name email role")
      .populate("targetId") // Mongoose now knows correct model (Candidate, Job, etc.)
      .sort({ createdAt: -1 })


    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});

// 🔹 Update Profile Route
router.put(
  "/update-profile",
  protect,
  profileUpload.single("profilePhoto"),
  async (req, res) => {
    try {

      const user = await User.findById(req.user._id);

      if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.designation = req.body.designation || user.designation;
        user.department = req.body.department || user.department;
        user.joinDate = req.body.joinDate || user.joinDate;
        user.appPassword = req.body.appPassword || user.appPassword;

        // 🗑️ REMOVE PHOTO
        if (req.body.removePhoto === "true") {
          if (user.profilePhoto) {
            const fs = require("fs");
            try {
              fs.unlinkSync(user.profilePhoto);
              console.log("🗑️ Old profile photo deleted");
            } catch (error) {
              console.log("⚠️ Failed to delete photo:", error.message);
            }
          }
          user.profilePhoto = null;
        }

        // 📤 NEW UPLOADED PHOTO
        if (req.file) {
          console.log("✅ New file uploaded:", req.file.path);
          user.profilePhoto = req.file.path;
        }

        const updatedUser = await user.save();
        console.log("✅ User updated successfully");

        res.json({
          success: true,
          user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            designation: updatedUser.designation,
            department: updatedUser.department,
            joinDate: updatedUser.joinDate,
            profilePhoto: updatedUser.profilePhoto,
            appPassword: updatedUser.appPassword,
            isAdmin: updatedUser.isAdmin,
            createdAt: updatedUser.createdAt,
          },
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);


module.exports = router;
