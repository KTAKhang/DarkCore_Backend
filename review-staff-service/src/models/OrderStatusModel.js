const mongoose = require("mongoose");

const orderStatusSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: [50, "Name must be at most 50 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [255, "Description must be at most 255 characters"]
        },
        color: {
            type: String,
            trim: true,
            default: "#000000"
        },
        sortOrder: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const OrderStatusModel = mongoose.model("orderstatuses", orderStatusSchema);
module.exports = OrderStatusModel;
