const mongoose = require("mongoose");

const tempOTPSchema = new mongoose.Schema({
    email: String,
    otp: String,
    expiresAt: Date,
    user_name: String,
    password: String,
    phone: String,
    address: String,
});

const TempOTPModel = mongoose.model("temp_otps", tempOTPSchema);
module.exports = TempOTPModel;
