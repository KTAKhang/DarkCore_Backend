const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orders",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: true
        },
        productName: {
            type: String,
            required: true,
            trim: true
        },
        productImage: {
            type: String,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        note: {
            type: String,
            trim: true,
            maxlength: [255, "Note must be at most 255 characters"]
        }
    },
    { timestamps: true }
);

const OrderDetailModel = mongoose.model("orderdetails", orderDetailSchema);
module.exports = OrderDetailModel;
