const FounderModel = require("../models/FounderModel");
const cloudinary = require("../config/cloudinaryConfig");

// ============================================
// 🔄 SHARED FUNCTIONS (Public - Không cần auth)
// ============================================

// ✅ Public: Lấy danh sách Founders (hiển thị trên trang web) - Có Pagination
const getFounders = async (query = {}) => {
    try {
        // ✅ Pagination - Mặc định: page=1, limit=10
        const page = query.page ? parseInt(query.page, 10) : 1;
        const limit = query.limit ? parseInt(query.limit, 10) : 10;

        // Validate pagination - Kiểm tra parse thành công
        if (isNaN(page) || page < 1) {
            return { 
                status: "ERR", 
                message: "Page phải là số nguyên lớn hơn hoặc bằng 1" 
            };
        }
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return { 
                status: "ERR", 
                message: "Limit phải là số nguyên từ 1 đến 100" 
            };
        }

        const skip = (page - 1) * limit;

        const filter = { status: true };

        // ✅ Đếm tổng số founders active
        const total = await FounderModel.countDocuments(filter);

        // ✅ Lấy data với pagination, sort theo sortOrder
        const founders = await FounderModel.find(filter)
            .sort({ sortOrder: 1, createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // ✅ Tính toán thông tin pagination
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return { 
            status: "OK", 
            data: founders,
            pagination: {
                total,              // Tổng số founders
                totalPages,         // Tổng số trang
                currentPage: page,  // Trang hiện tại
                limit,              // Số items mỗi trang
                hasNextPage,        // Có trang tiếp theo?
                hasPrevPage         // Có trang trước?
            }
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

        // ✅ Kiểm tra fullName đã tồn tại chưa (case-insensitive)
        const trimmedFullName = fullName.trim();
        
        // Escape special regex characters trong fullName
        const escapedFullName = trimmedFullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const existingFounder = await FounderModel.findOne({
            fullName: { $regex: new RegExp(`^${escapedFullName}$`, 'i') }
        }).lean();

        if (existingFounder) {
            return { 
                status: "ERR", 
                message: `Founder với tên "${trimmedFullName}" đã tồn tại trong hệ thống` 
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

        // ✅ XỬ LÝ SORTORDER
        let finalSortOrder;

        if (sortOrder !== undefined && sortOrder !== null && sortOrder !== "") {
            // Trường hợp 1: User truyền sortOrder
            const parsedSortOrder = typeof sortOrder === "string" 
                ? parseInt(sortOrder, 10) 
                : sortOrder;

            // Validate sortOrder
            if (isNaN(parsedSortOrder) || !Number.isFinite(parsedSortOrder)) {
                return { 
                    status: "ERR", 
                    message: "sortOrder phải là một số hợp lệ" 
                };
            }

            if (!Number.isInteger(parsedSortOrder)) {
                return { 
                    status: "ERR", 
                    message: "sortOrder phải là số nguyên" 
                };
            }

            if (parsedSortOrder < 1) {
                return { 
                    status: "ERR", 
                    message: "sortOrder phải lớn hơn hoặc bằng 1" 
                };
            }

            // ✅ Shift các founders khác có sortOrder >= parsedSortOrder
            await FounderModel.updateMany(
                { sortOrder: { $gte: parsedSortOrder } },
                { $inc: { sortOrder: 1 } }
            );

            finalSortOrder = parsedSortOrder;
        } else {
            // Trường hợp 2: User KHÔNG truyền sortOrder
            // Tự động lấy sortOrder lớn nhất + 1
            const maxFounder = await FounderModel.findOne()
                .sort({ sortOrder: -1 })
                .select('sortOrder')
                .lean();

            finalSortOrder = maxFounder && maxFounder.sortOrder 
                ? maxFounder.sortOrder + 1 
                : 1;
        }

        const founder = await FounderModel.create({
            fullName: trimmedFullName,
            position,
            avatar,
            avatarPublicId,
            bio,
            quote,
            email,
            phone,
            socialMedia: parsedSocialMedia,
            achievements: parsedAchievements,
            sortOrder: finalSortOrder,
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

// ✅ Admin: Lấy tất cả Founders (bao gồm ẩn) - Có Search, Pagination
const getAllFoundersForAdmin = async (query = {}) => {
    try {
        const filter = {};
        
        // ✅ Filter theo status nếu có
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        }

        // ✅ Search theo fullName (case-insensitive, partial match)
        if (query.search && query.search.trim()) {
            filter.fullName = { 
                $regex: query.search.trim(), 
                $options: 'i' // Case-insensitive
            };
        }

        // ✅ Pagination - Mặc định: page=1, limit=3
        const page = query.page ? parseInt(query.page, 10) : 1;
        const limit = query.limit ? parseInt(query.limit, 10) : 3;

        // Validate pagination - Kiểm tra parse thành công
        if (isNaN(page) || page < 1) {
            return { 
                status: "ERR", 
                message: "Page phải là số nguyên lớn hơn hoặc bằng 1" 
            };
        }
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return { 
                status: "ERR", 
                message: "Limit phải là số nguyên từ 1 đến 100" 
            };
        }

        const skip = (page - 1) * limit;

        // ✅ Đếm tổng số documents
        const total = await FounderModel.countDocuments(filter);

        // ✅ Lấy data với pagination (không sort)
        const founders = await FounderModel.find(filter)
            .skip(skip)
            .limit(limit)
            .lean();
        
        // ✅ Tính toán thông tin pagination
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return { 
            status: "OK", 
            data: founders,
            pagination: {
                total,              // Tổng số founders
                totalPages,         // Tổng số trang
                currentPage: page,  // Trang hiện tại
                limit,              // Số items mỗi trang
                hasNextPage,        // Có trang tiếp theo?
                hasPrevPage         // Có trang trước?
            }
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

        // ✅ Kiểm tra fullName đã tồn tại chưa (nếu có thay đổi fullName)
        let trimmedFullName = null;
        if (fullName) {
            trimmedFullName = fullName.trim();
            
            // Escape special regex characters trong fullName
            const escapedFullName = trimmedFullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Kiểm tra duplicate - LOẠI TRỪ founder hiện tại
            const existingFounder = await FounderModel.findOne({
                _id: { $ne: id }, // Loại trừ founder hiện tại
                fullName: { $regex: new RegExp(`^${escapedFullName}$`, 'i') }
            }).lean();

            if (existingFounder) {
                return { 
                    status: "ERR", 
                    message: `Founder với tên "${trimmedFullName}" đã tồn tại trong hệ thống` 
                };
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
        if (trimmedFullName) {
            updateData.fullName = trimmedFullName;
        }
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

// ✅ Admin: Cập nhật thứ tự hiển thị (Tự động điều chỉnh các items khác)
const updateSortOrder = async (id, sortOrder) => {
    try {
        // ✅ Kiểm tra sortOrder có tồn tại không
        if (sortOrder === undefined || sortOrder === null) {
            return { 
                status: "ERR", 
                message: "Thiếu sortOrder" 
            };
        }

        // ✅ Parse sortOrder nếu là string (từ FormData hoặc query params)
        const newSortOrder = typeof sortOrder === "string" 
            ? parseInt(sortOrder, 10) 
            : sortOrder;

        // ✅ Kiểm tra sortOrder có phải là số hợp lệ không
        if (isNaN(newSortOrder) || !Number.isFinite(newSortOrder)) {
            return { 
                status: "ERR", 
                message: "sortOrder phải là một số hợp lệ" 
            };
        }

        // ✅ Kiểm tra sortOrder có phải là số nguyên không
        if (!Number.isInteger(newSortOrder)) {
            return { 
                status: "ERR", 
                message: "sortOrder phải là số nguyên" 
            };
        }

        // ✅ Kiểm tra sortOrder phải >= 1
        if (newSortOrder < 1) {
            return { 
                status: "ERR", 
                message: "sortOrder phải lớn hơn hoặc bằng 1" 
            };
        }

        // ✅ Lấy thông tin founder hiện tại
        const currentFounder = await FounderModel.findById(id);
        
        if (!currentFounder) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy Founder" 
            };
        }

        const oldSortOrder = currentFounder.sortOrder || 1;

        // ✅ Nếu sortOrder không đổi, không cần làm gì
        if (oldSortOrder === newSortOrder) {
            return { 
                status: "OK", 
                message: "Thứ tự không thay đổi", 
                data: currentFounder 
            };
        }

        // ✅ TỰ ĐỘNG ĐIỀU CHỈNH các founders khác để tránh duplicate
        
        if (newSortOrder > oldSortOrder) {
            // Di chuyển xuống: giảm sortOrder của các items ở giữa
            // Ví dụ: A(1), B(2), C(3) -> Đổi A từ 1 thành 3
            // Kết quả: B(1), C(2), A(3)
            await FounderModel.updateMany(
                {
                    _id: { $ne: id }, // Không phải item hiện tại
                    sortOrder: { $gt: oldSortOrder, $lte: newSortOrder }
                },
                { $inc: { sortOrder: -1 } } // Giảm 1
            );
        } else {
            // Di chuyển lên: tăng sortOrder của các items ở giữa
            // Ví dụ: A(1), B(2), C(3) -> Đổi C từ 3 thành 1
            // Kết quả: C(1), A(2), B(3)
            await FounderModel.updateMany(
                {
                    _id: { $ne: id }, // Không phải item hiện tại
                    sortOrder: { $gte: newSortOrder, $lt: oldSortOrder }
                },
                { $inc: { sortOrder: 1 } } // Tăng 1
            );
        }

        // ✅ Cập nhật sortOrder của item hiện tại
        const updatedFounder = await FounderModel.findByIdAndUpdate(
            id,
            { sortOrder: newSortOrder },
            { new: true, runValidators: true }
        );

        return { 
            status: "OK", 
            message: "Cập nhật thứ tự thành công (đã tự động điều chỉnh các items khác)", 
            data: updatedFounder 
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
    permanentDeleteFounder,     // ✅ Admin: Xóa vĩnh viễn
    updateSortOrder             // ✅ Admin: Cập nhật thứ tự hiển thị
};

