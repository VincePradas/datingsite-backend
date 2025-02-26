const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Register Route
router.post("/register", async (req, res) => {
  const { name, email, password, age, gender, interests, bio, profilePicture, yrlevel, course } = req.body;
  console.log("Request Body:", req.body);
  if (!yrlevel || !course) {
    return res.status(400).json({ msg: "yrlevel and course are required" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
      age,
      gender,
      interests,
      bio,
      profilePicture,
      yrlevel,
      course,
    });

    await user.save();
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error", error: err });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  try {
    const user = await User.findOne({ email: trimmedEmail.toLowerCase() });
    if (!user) {
      console.log("User not found in DB");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("User Found:", user.email);
    console.log("Stored Hashed Password:", user.password);
    console.log("Provided Password:", trimmedPassword);

    // Ensure password exists before comparing
    if (!user.password) {
      console.log("User signed up with Google, rejecting login.");
      return res.status(401).json({ message: "Use Google login" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    console.log("Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log("Generated Token:", token);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged in successfully", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth Login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  async (req, res) => {
    try {
      let user = await User.findOne({ email: req.user.email });

      if (!user) {
        user = new User({
          name: req.user.displayName,
          email: req.user.email,
          profilePicture: req.user.photos[0].value,
          yrlevel: null,  
          course: null,  
        });

        await user.save();
      }

      // Generate token
      const token = generateToken(user);
      res.cookie("token", token, { httpOnly: true, secure: false });

      if (!user.yrlevel || !user.course) {
        return res.redirect("/complete-profile");
      }

      res.redirect("/api/auth/profile");
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Protected Routes
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      console.err(err);
    }
  }
);

// Update Password
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/update-profile",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { name, age, gender, course, yrlevel, interests, bio, profilePicture, password } =
      req.body;

    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });
      console.log('User object:', user);
      console.log('User password:', user.password);
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Incorrect password. Profile update denied." });

      user.name = name || user.name;
      user.age = age || user.age;
      user.gender = gender || user.gender;
      user.course = course || user.course;
      user.yrlevel = yrlevel || user.yrlevel;
      user.interests = interests || user.interests;
      user.bio = bio || user.bio;
      user.profilePicture = profilePicture || user.profilePicture;

      await user.save();
      res.json({ message: "Profile updated successfully", user });
    } catch (err) {
      console.error(err); 
      res.status(500).json({ message: "Server error"});
    }
  }
);

router.put(
  "/create-password",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { newPassword, confirmNewPassword } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.password) {
        return res
          .status(400)
          .json({
            message: "Password already set. Use update password instead.",
          });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password added successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
