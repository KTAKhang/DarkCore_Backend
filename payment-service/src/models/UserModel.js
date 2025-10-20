const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        user_name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "User name must be at most 100 characters"]
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
        },
        password: {
            type: String,
            required: true,
            minlength: [6, "Password must be at least 6 characters"]
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone must be at most 20 characters"]
        },
        address: {
            type: String,
            trim: true,
            maxlength: [255, "Address must be at most 255 characters"]
        },
        role: {
            type: String,
            enum: ['customer', 'admin', 'staff'],
            default: 'customer'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        avatar: {
            type: String,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        }
    },
    { timestamps: true }
);

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel;
