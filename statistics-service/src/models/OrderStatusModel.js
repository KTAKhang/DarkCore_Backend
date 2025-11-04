const mongoose = require("mongoose");

const orderStatusSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        description: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

const OrderStatusModel = mongoose.model("orderstatuses", orderStatusSchema);
module.exports = OrderStatusModel;

