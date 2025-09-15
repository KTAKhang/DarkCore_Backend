const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    user_name: String,
    email: String,
    password: String,
    avatar: String,
    role_id: mongoose.Schema.Types.ObjectId,
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    status: String,
    access_token: String,
    googleId: String,
    isGoogleAccount: Boolean,
    phone: String,
    address: String,
}, { timestamps: true });

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel;
