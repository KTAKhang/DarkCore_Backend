const mongoose = require("mongoose");

const orderStatusSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        description: {
            type: String,
            trim: true
        },
        color: {
            type: String,
            trim: true,
            default: "#6B7280"
        },
        sortOrder: {
            type: Number,
            default: 0
        },
        status: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const OrderStatusModel = mongoose.model("orderstatuses", orderStatusSchema);
module.exports = OrderStatusModel;
