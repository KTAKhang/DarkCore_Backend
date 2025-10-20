const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, "Product name must be at most 200 characters"]
        },
        description: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        originalPrice: {
            type: Number,
            min: 0
        },
        images: [{
            type: String,
            trim: true
        }],
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            required: true
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "brands"
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        soldQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'out_of_stock'],
            default: 'active'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        tags: [{
            type: String,
            trim: true
        }],
        specifications: {
            type: mongoose.Schema.Types.Mixed
        },
        weight: {
            type: Number,
            min: 0
        },
        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 }
        }
    },
    { timestamps: true }
);

const ProductModel = mongoose.model("products", productSchema);
module.exports = ProductModel;
