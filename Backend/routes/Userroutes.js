const express = require("express");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");

const router = express.Router();

// ➕ Create New User
router.post("/", async (req, res) => {
  try {
    const { name, email, designation, password, reporter, isAdmin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      name,
      email,
      designation,
      password,
      reporter: reporter || null,
      isAdmin: isAdmin || false,
      appPassword: req.body.appPassword,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 📋 Get All Users
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .populate("reporter", "name designation");;
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, email, designation, reporter, password, isAdmin } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Check if email exists but ignore the same user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.designation = designation || user.designation;
    user.reporter = reporter || user.reporter;
    user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
    user.appPassword = req.body.appPassword || user.appPassword;

    // Update password if provided
    if (password) {
      user.password = password;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// delete
router.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Server error" });
  }
});




module.exports = router;
