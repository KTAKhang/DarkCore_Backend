const mongoose = require("mongoose");

const founderSchema = new mongoose.Schema(
    {
        // Thông tin cơ bản
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "Tên không được vượt quá 100 ký tự"]
        },
        position: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "Chức vụ không được vượt quá 100 ký tự"]
        },
        avatar: {
            type: String,
            trim: true
        },
        avatarPublicId: {
            type: String,
            trim: true
        },
        
        // Tiểu sử
        bio: {
            type: String,
            required: true,
            trim: true,
            maxlength: [2000, "Tiểu sử không được vượt quá 2000 ký tự"]
        },
        
        // Quote/Trích dẫn
        quote: {
            type: String,
            trim: true,
            maxlength: [500, "Trích dẫn không được vượt quá 500 ký tự"]
        },
        
        // Thông tin liên hệ
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Email không hợp lệ"]
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Số điện thoại không được vượt quá 20 ký tự"]
        },
        
        // Mạng xã hội
        socialMedia: {
            facebook: {
                type: String,
                trim: true
            },
            instagram: {
                type: String,
                trim: true
            },
            twitter: {
                type: String,
                trim: true
            },
            linkedin: {
                type: String,
                trim: true
            }
        },
        
        // Thành tựu
        achievements: [{
            title: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, "Tiêu đề thành tựu không được vượt quá 200 ký tự"]
            },
            description: {
                type: String,
                trim: true,
                maxlength: [500, "Mô tả thành tựu không được vượt quá 500 ký tự"]
            },
            year: {
                type: Number,
                min: 1900,
                max: 2100
            }
        }],
        
        // Thứ tự hiển thị
        sortOrder: {
            type: Number,
            default: 0
        },
        
        // Trạng thái (true: hiển thị, false: ẩn)
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const FounderModel = mongoose.model("founders", founderSchema);
module.exports = FounderModel;

