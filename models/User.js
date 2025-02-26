const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, default: null },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    age: { type: Number, required: false },
    gender: { type: String, required: false },
    interests: { type: [String], required: false },
    bio: { type: String, required: false },
    profilePicture: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

UserSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
