const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountPercent: { type: Number, required: true, min: 1, max: 100 },
        minOrderValue: { type: Number, default: 0, min: 0 },
        maxDiscountAmount: { type: Number, default: null, min: 0 }, // Giới hạn số tiền giảm tối đa
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Discount", discountSchema);


