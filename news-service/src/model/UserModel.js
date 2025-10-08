const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role_name: { type: String, default: "user" },
    avatar: { type: String },
    // Thêm fields khác nếu cần
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
