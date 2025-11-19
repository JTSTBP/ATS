const express = require("express");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select("+password");
//     if (!user)
//       return res.status(400).json({ message: "User not found or wrong role" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid password" });

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         designation: user.designation,
//         isAdmin: user.isAdmin,
//         createdAt: user.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

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


module.exports = router;
