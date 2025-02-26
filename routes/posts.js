const express = require("express");
const passport = require("passport");
const Post = require("../models/Post");

const router = express.Router();

// Create a Post
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user._id,
      content: req.body.content,
      image: req.body.image || "",
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name profilePicture");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update
router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.content = req.body.content || post.content;
    post.image = req.body.image || post.image;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// React to a Post
router.post("/:id/react", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingReaction = post.reactions.find(
      (reaction) => reaction.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.type = req.body.type;
    } else {
      post.reactions.push({ user: req.user._id, type: req.body.type });
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
