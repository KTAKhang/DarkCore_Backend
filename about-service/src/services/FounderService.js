const FounderModel = require("../models/FounderModel");
const cloudinary = require("../config/cloudinaryConfig");

// ============================================
// 🔄 SHARED FUNCTIONS (Public - Không cần auth)
// ============================================

// ✅ Public: Lấy danh sách Founders (hiển thị trên trang web)
const getFounders = async () => {
    try {
        const founders = await FounderModel.find({ 
            status: true 
        })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();
        
        return { 
            status: "OK", 
            data: founders 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Public: Lấy chi tiết Founder theo ID
const getFounderById = async (id) => {
    try {
        const founder = await FounderModel.findOne({ 
            _id: id, 
            status: true 
        }).lean();
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy thông tin Founder" 
            };
        }
        
        return { 
            status: "OK", 
            data: founder 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ============================================
// 👨‍💼 ADMIN FUNCTIONS
// ============================================

// ✅ Admin: Tạo Founder mới
const createFounder = async (payload) => {
    try {
        const {
            fullName,
            position,
            avatar,
            avatarPublicId,
            bio,
            quote,
            email,
            phone,
            socialMedia,
            achievements,
            sortOrder
        } = payload;

        // Validation
        if (!fullName || !position || !bio) {
            return { 
                status: "ERR", 
                message: "Thiếu các trường bắt buộc: fullName, position, bio" 
            };
        }

        // ✅ Parse socialMedia nếu là string (từ FormData)
        let parsedSocialMedia = socialMedia || {};
        if (typeof socialMedia === "string") {
            try {
                parsedSocialMedia = JSON.parse(socialMedia);
            } catch (e) {
                console.error("Error parsing socialMedia:", e);
                parsedSocialMedia = {};
            }
        }

        // ✅ Parse achievements nếu là string (từ FormData)
        let parsedAchievements = achievements || [];
        if (typeof achievements === "string") {
            try {
                parsedAchievements = JSON.parse(achievements);
            } catch (e) {
                console.error("Error parsing achievements:", e);
                parsedAchievements = [];
            }
        }

        // ✅ Parse boolean fields (từ FormData string sang boolean)
        const parsedStatus = payload.status !== undefined 
            ? (payload.status === "true" || payload.status === true) 
            : true;

        const founder = await FounderModel.create({
            fullName,
            position,
            avatar,
            avatarPublicId,
            bio,
            quote,
            email,
            phone,
            socialMedia: parsedSocialMedia,
            achievements: parsedAchievements,
            sortOrder: sortOrder || 0,
            status: parsedStatus
        });

        return { 
            status: "OK", 
            message: "Tạo Founder thành công", 
            data: founder 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Lấy tất cả Founders (bao gồm ẩn)
const getAllFoundersForAdmin = async (query = {}) => {
    try {
        const filter = {};
        
        // Filter theo status nếu có
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        }

        const founders = await FounderModel.find(filter)
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
        
        return { 
            status: "OK", 
            data: founders 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Lấy chi tiết Founder theo ID (bao gồm ẩn)
const getFounderByIdForAdmin = async (id) => {
    try {
        const founder = await FounderModel.findById(id).lean();
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }
        
        return { 
            status: "OK", 
            data: founder 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Cập nhật Founder
const updateFounder = async (id, payload) => {
    try {
        const founder = await FounderModel.findById(id);
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }

        const {
            fullName,
            position,
            avatar,
            avatarPublicId,
            bio,
            quote,
            email,
            phone,
            socialMedia,
            achievements,
            sortOrder,
            status
        } = payload;

        // ✅ Parse socialMedia nếu là string (từ FormData)
        let parsedSocialMedia = socialMedia;
        if (typeof socialMedia === "string") {
            try {
                parsedSocialMedia = JSON.parse(socialMedia);
            } catch (e) {
                console.error("Error parsing socialMedia:", e);
                parsedSocialMedia = undefined; // Giữ nguyên giá trị cũ
            }
        }

        // ✅ Parse achievements nếu là string (từ FormData)
        let parsedAchievements = achievements;
        if (typeof achievements === "string") {
            try {
                parsedAchievements = JSON.parse(achievements);
            } catch (e) {
                console.error("Error parsing achievements:", e);
                parsedAchievements = undefined; // Giữ nguyên giá trị cũ
            }
        }

        // ✅ Xóa avatar cũ trên Cloudinary nếu upload avatar mới
        if (avatar && founder.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(founder.avatarPublicId);
            } catch (e) {
                console.error("Error deleting old avatar:", e);
            }
        }

        // ✅ Parse boolean fields (từ FormData string sang boolean)
        const parsedStatus = status !== undefined 
            ? (status === "true" || status === true) 
            : undefined;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (position) updateData.position = position;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (avatarPublicId !== undefined) updateData.avatarPublicId = avatarPublicId;
        if (bio) updateData.bio = bio;
        if (quote !== undefined) updateData.quote = quote;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (parsedSocialMedia !== undefined) updateData.socialMedia = parsedSocialMedia;
        if (parsedAchievements !== undefined) updateData.achievements = parsedAchievements;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (parsedStatus !== undefined) updateData.status = parsedStatus;

        const updated = await FounderModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return { 
            status: "OK", 
            message: "Cập nhật Founder thành công", 
            data: updated 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Xóa Founder (soft delete)
const deleteFounder = async (id) => {
    try {
        const founder = await FounderModel.findById(id);
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }

        // ✅ Xóa avatar trên Cloudinary
        if (founder.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(founder.avatarPublicId);
            } catch (e) {
                console.error("Error deleting avatar:", e);
            }
        }

        const deleted = await FounderModel.findByIdAndUpdate(
            id,
            { status: false },
            { new: true }
        );

        return { 
            status: "OK", 
            message: "Xóa Founder thành công", 
            data: deleted 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Xóa vĩnh viễn Founder
const permanentDeleteFounder = async (id) => {
    try {
        const founder = await FounderModel.findById(id);
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }

        // ✅ Xóa avatar trên Cloudinary
        if (founder.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(founder.avatarPublicId);
            } catch (e) {
                console.error("Error deleting avatar:", e);
            }
        }

        const deleted = await FounderModel.findByIdAndDelete(id);

        return { 
            status: "OK", 
            message: "Xóa vĩnh viễn Founder thành công", 
            data: deleted 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Cập nhật thứ tự hiển thị
const updateSortOrder = async (id, sortOrder) => {
    try {
        if (sortOrder === undefined || sortOrder === null) {
            return { 
                status: "ERR", 
                message: "Thiếu sortOrder" 
            };
        }

        const founder = await FounderModel.findByIdAndUpdate(
            id,
            { sortOrder },
            { new: true, runValidators: true }
        );
        
        if (!founder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }

        return { 
            status: "OK", 
            message: "Cập nhật thứ tự thành công", 
            data: founder 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ============================================
// 📦 EXPORTS
// ============================================

module.exports = {
    // Public Functions
    getFounders,                // ✅ Public: Danh sách Founders trên web
    getFounderById,             // ✅ Public: Chi tiết Founder
    
    // Admin Functions
    createFounder,              // ✅ Admin: Tạo Founder mới
    getAllFoundersForAdmin,     // ✅ Admin: Xem tất cả Founders
    getFounderByIdForAdmin,     // ✅ Admin: Chi tiết Founder (bao gồm inactive)
    updateFounder,              // ✅ Admin: Cập nhật Founder
    deleteFounder,              // ✅ Admin: Xóa (soft delete)
    permanentDeleteFounder,     // ✅ Admin: Xóa vĩnh viễn
    updateSortOrder             // ✅ Admin: Cập nhật thứ tự hiển thị
};

