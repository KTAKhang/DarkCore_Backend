const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        shippingFee: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        orderDate: {
            type: Date,
            default: Date.now
        },
        orderStatusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orderstatuses",
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'bank_transfer', 'credit_card', 'e_wallet', 'vnpay'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: {
            type: String,
            trim: true
        },
        paidAt: {
            type: Date
        },
        note: {
            type: String,
            trim: true,
            maxlength: [255, "Note must be at most 255 characters"]
        },
        receiverAddress: {
            type: String,
            required: true,
            trim: true,
            maxlength: [255, "Receiver address must be at most 255 characters"]
        },
        receiverName: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "Receiver name must be at most 100 characters"]
        },
        receiverPhone: {
            type: String,
            required: true,
            trim: true,
            maxlength: [20, "Receiver phone must be at most 20 characters"]
        },
        trackingNumber: {
            type: String,
            trim: true
        },
        deliveredAt: {
            type: Date
        },
        cancelledAt: {
            type: Date
        },
        cancelledReason: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// Pre-save middleware để tự động tạo orderNumber
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Đếm số đơn hàng trong ngày
        const todayStart = new Date(year, date.getMonth(), date.getDate());
        const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
        
        const count = await this.constructor.countDocuments({
            createdAt: { $gte: todayStart, $lt: todayEnd }
        });
        
        this.orderNumber = `ORD${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const OrderModel = mongoose.model("orders", orderSchema);
module.exports = OrderModel;
