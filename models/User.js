const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    age: {
      type: Number,
      required: function () {
        return !this.googleId;
      },
    },
    gender: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    height: {
      type: String,
      required: false
    },

    // Default "not set" for Google users
    course: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      default: "not set",
    },
    yrlevel: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      enum: ["freshmen", "sophomore", "junior", "senior", "not set"],
      default: "not set",
    },

    interests: {
      type: [String],
      required: function () {
        return !this.googleId;
      },
    },
    bio: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    profilePicture: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },

    // Matching System
    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    passedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    matchedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Hash Password
UserSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
