const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
    {
        // Thông tin cơ bản
        storeName: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, "Tên cửa hàng không được vượt quá 100 ký tự"]
        },
        slogan: {
            type: String,
            trim: true,
            maxlength: [200, "Slogan không được vượt quá 200 ký tự"]
        },
        logo: {
            type: String,
            trim: true
        },
        logoPublicId: {
            type: String,
            trim: true
        },
        
        // Câu chuyện và giá trị
        story: {
            type: String,
            required: true,
            trim: true,
            maxlength: [5000, "Câu chuyện không được vượt quá 5000 ký tự"]
        },
        mission: {
            type: String,
            trim: true,
            maxlength: [1000, "Sứ mệnh không được vượt quá 1000 ký tự"]
        },
        vision: {
            type: String,
            trim: true,
            maxlength: [1000, "Tầm nhìn không được vượt quá 1000 ký tự"]
        },
        coreValues: [{
            title: {
                type: String,
                required: true,
                trim: true,
                maxlength: [100, "Tiêu đề giá trị cốt lõi không được vượt quá 100 ký tự"]
            },
            description: {
                type: String,
                required: true,
                trim: true,
                maxlength: [500, "Mô tả giá trị cốt lõi không được vượt quá 500 ký tự"]
            },
            icon: {
                type: String,
                trim: true
            }
        }],
        
        // Thông tin liên hệ
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Email không hợp lệ"]
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: [20, "Số điện thoại không được vượt quá 20 ký tự"]
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: [255, "Địa chỉ không được vượt quá 255 ký tự"]
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
            youtube: {
                type: String,
                trim: true
            },
            linkedin: {
                type: String,
                trim: true
            }
        },
        
        // Thống kê
        stats: {
            yearsOfOperation: {
                type: Number,
                min: 0,
                default: 0
            },
            totalCustomers: {
                type: Number,
                min: 0,
                default: 0
            },
            totalProducts: {
                type: Number,
                min: 0,
                default: 0
            },
            totalOrders: {
                type: Number,
                min: 0,
                default: 0
            }
        },
        
        // Hình ảnh
        images: [{
            type: String,
            trim: true
        }],
        imagePublicIds: [{
            type: String,
            trim: true
        }],
        
        // Giờ làm việc
        workingHours: {
            type: String,
            trim: true,
            maxlength: [200, "Giờ làm việc không được vượt quá 200 ký tự"]
        },
        
        // Trạng thái (true: hiển thị, false: ẩn)
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const AboutModel = mongoose.model("about", aboutSchema);
module.exports = AboutModel;

