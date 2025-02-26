const express = require("express");
const router = express.Router();
const User = require("../models/User");
const passport = require("passport");

// Like (Swipe Right)
router.post(
  "/like/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await User.findById(req.user._id);
      const likedUser = await User.findById(userId);

      if (!likedUser)
        return res.status(404).json({ message: "User not found" });

      if (currentUser.likedUsers.includes(userId)) {
        return res.status(400).json({ message: "Already liked this user" });
      }

      // Add to likedUsers
      currentUser.likedUsers.push(userId);
      await currentUser.save();

      // Check if Match
      if (likedUser.likedUsers.includes(req.user._id)) {
        currentUser.matchedUsers.push(userId);
        likedUser.matchedUsers.push(req.user._id);
        await currentUser.save();
        await likedUser.save();
        return res.json({ message: "It's a match!", matched: true });
      }

      res.json({ message: "User liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Pass (Swipe Left)
router.post(
  "/pass/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await User.findById(req.user._id);

      if (!currentUser)
        return res.status(404).json({ message: "User not found" });
      if (currentUser.passedUsers.includes(userId)) {
        return res.status(400).json({ message: "Already passed this user" });
      }

      currentUser.passedUsers.push(userId);
      await currentUser.save();

      res.json({ message: "User passed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Get Matched Users
router.get(
  "/matches",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate(
        "matchedUsers",
        "name profilePicture"
      );
      res.json({ matches: user.matchedUsers });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

module.exports = router;
