const AboutModel = require("../models/AboutModel");
const cloudinary = require("../config/cloudinaryConfig");

// ============================================
// 🔄 SHARED FUNCTIONS (Public - Không cần auth)
// ============================================

// ✅ Public: Lấy thông tin About Us (hiển thị trên trang web)
const getAboutInfo = async () => {
    try {
        // Lấy thông tin About Us đầu tiên và đang hiển thị
        const about = await AboutModel.findOne({ 
            status: true 
        }).lean();
        
        if (!about) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy thông tin About Us" 
            };
        }
        
        return { 
            status: "OK", 
            data: about 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ============================================
// 👨‍💼 ADMIN FUNCTIONS
// ============================================

// ✅ Admin: Tạo hoặc cập nhật thông tin About Us
const createOrUpdateAbout = async (payload) => {
    try {
        const {
            storeName,
            slogan,
            logo,
            logoPublicId,
            story,
            mission,
            vision,
            coreValues,
            email,
            phone,
            address,
            socialMedia,
            stats,
            images,
            imagePublicIds,
            workingHours
        } = payload;

        // Validation
        if (!storeName || !story || !email || !phone || !address) {
            return { 
                status: "ERR", 
                message: "Thiếu các trường bắt buộc: storeName, story, email, phone, address" 
            };
        }

        // ✅ Parse coreValues nếu là string (từ FormData)
        let parsedCoreValues = coreValues || [];
        if (typeof coreValues === "string") {
            try {
                parsedCoreValues = JSON.parse(coreValues);
            } catch (e) {
                console.error("Error parsing coreValues:", e);
                parsedCoreValues = [];
            }
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

        // ✅ Parse stats nếu là string (từ FormData)
        let parsedStats = stats || {};
        if (typeof stats === "string") {
            try {
                parsedStats = JSON.parse(stats);
            } catch (e) {
                console.error("Error parsing stats:", e);
                parsedStats = {};
            }
        }

        // ✅ XỬ LÝ IMAGES giống Product Service
        if (payload.images) {
            if (typeof payload.images === "string") {
                try {
                    const parsed = JSON.parse(payload.images);
                    payload.images = parsed;
                } catch (e) {
                    payload.images = [payload.images];
                }
            }
            
            if (Array.isArray(payload.images)) {
                const processedImages = payload.images.map(img => {
                    if (typeof img === "string") {
                        return img;
                    } else if (typeof img === "object" && img.url) {
                        return img.url;
                    } else if (typeof img === "object" && img.uid) {
                        return `placeholder-${img.uid}`;
                    }
                    return null;
                }).filter(img => img !== null);
                
                payload.images = processedImages;
            }
        }
        
        if (payload.imagePublicIds) {
            if (typeof payload.imagePublicIds === "string") {
                payload.imagePublicIds = [payload.imagePublicIds];
            } else if (Array.isArray(payload.imagePublicIds)) {
                payload.imagePublicIds = payload.imagePublicIds.map(id => {
                    if (typeof id === "string") {
                        return id;
                    } else if (typeof id === "object" && id.publicId) {
                        return id.publicId;
                    }
                    return null;
                }).filter(id => id !== null);
            }
        }

        // Kiểm tra xem đã có About Us chưa
        const existingAbout = await AboutModel.findOne();

        let about;
        if (existingAbout) {
            // ✅ Xóa ảnh cũ trên Cloudinary nếu upload ảnh mới
            if (logo && existingAbout.logoPublicId) {
                try {
                    await cloudinary.uploader.destroy(existingAbout.logoPublicId);
                } catch (e) {
                    console.error("Error deleting old logo:", e);
                }
            }
            
            if (Array.isArray(payload.images) && payload.images.length > 0 && 
                Array.isArray(existingAbout.imagePublicIds) && existingAbout.imagePublicIds.length > 0) {
                try {
                    await Promise.all(
                        existingAbout.imagePublicIds.map((pid) =>
                            cloudinary.uploader.destroy(pid)
                        )
                    );
                } catch (e) {
                    console.error("Error deleting old images:", e);
                }
            }
            
            // ✅ Parse boolean fields (từ FormData string sang boolean)
            const parsedStatus = payload.status !== undefined 
                ? (payload.status === "true" || payload.status === true) 
                : true;

            // Update nếu đã tồn tại
            about = await AboutModel.findByIdAndUpdate(
                existingAbout._id,
                {
                    storeName,
                    slogan,
                    logo: logo || existingAbout.logo,
                    logoPublicId: logoPublicId || existingAbout.logoPublicId,
                    story,
                    mission,
                    vision,
                    coreValues: parsedCoreValues,
                    email,
                    phone,
                    address,
                    socialMedia: parsedSocialMedia,
                    stats: parsedStats,
                    images: payload.images || existingAbout.images || [],
                    imagePublicIds: payload.imagePublicIds || existingAbout.imagePublicIds || [],
                    workingHours,
                    status: parsedStatus
                },
                { new: true, runValidators: true }
            );
            
            return { 
                status: "OK", 
                message: "Cập nhật thông tin About Us thành công", 
                data: about 
            };
        } else {
            // ✅ Parse boolean fields (từ FormData string sang boolean)
            const parsedStatus = payload.status !== undefined 
                ? (payload.status === "true" || payload.status === true) 
                : true;

            // Tạo mới nếu chưa tồn tại
            about = await AboutModel.create({
                storeName,
                slogan,
                logo,
                logoPublicId,
                story,
                mission,
                vision,
                coreValues: parsedCoreValues,
                email,
                phone,
                address,
                socialMedia: parsedSocialMedia,
                stats: parsedStats,
                images: payload.images || [],
                imagePublicIds: payload.imagePublicIds || [],
                workingHours,
                status: parsedStatus
            });
            
            return { 
                status: "OK", 
                message: "Tạo thông tin About Us thành công", 
                data: about 
            };
        }
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Lấy thông tin About Us (bao gồm cả inactive)
const getAboutInfoForAdmin = async () => {
    try {
        const about = await AboutModel.findOne().lean();
        
        if (!about) {
            return { 
                status: "ERR", 
                message: "Chưa có thông tin About Us. Vui lòng tạo mới." 
            };
        }
        
        return { 
            status: "OK", 
            data: about 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Cập nhật trạng thái About Us
const updateAboutStatus = async (payload) => {
    try {
        const { status: newStatus } = payload;

        const about = await AboutModel.findOne();
        
        if (!about) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy thông tin About Us" 
            };
        }

        if (newStatus === undefined) {
            return { 
                status: "ERR", 
                message: "Thiếu trường status" 
            };
        }

        const updated = await AboutModel.findByIdAndUpdate(
            about._id,
            { status: newStatus },
            { new: true, runValidators: true }
        );

        return { 
            status: "OK", 
            message: "Cập nhật trạng thái thành công", 
            data: updated 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Cập nhật thống kê
const updateStats = async (stats) => {
    try {
        if (!stats || typeof stats !== 'object') {
            return { 
                status: "ERR", 
                message: "Dữ liệu thống kê không hợp lệ" 
            };
        }

        const about = await AboutModel.findOne();
        
        if (!about) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy thông tin About Us" 
            };
        }

        const updated = await AboutModel.findByIdAndUpdate(
            about._id,
            { stats },
            { new: true, runValidators: true }
        );

        return { 
            status: "OK", 
            message: "Cập nhật thống kê thành công", 
            data: updated 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Xóa About Us (soft delete)
// ✅ THAY ĐỔI BACKEND - Hard Delete
const deleteAbout = async () => {
    try {
        const about = await AboutModel.findOne();
        
        if (!about) {
            return { 
                status: "ERR", 
                message: "Không tìm thấy thông tin About Us" 
            };
        }

        // ✅ Xóa ảnh trên Cloudinary
        if (about.logoPublicId) {
            try {
                await cloudinary.uploader.destroy(about.logoPublicId);
            } catch (e) {
                console.error("Error deleting logo:", e);
            }
        }
        
        if (Array.isArray(about.imagePublicIds) && about.imagePublicIds.length > 0) {
            try {
                await Promise.all(
                    about.imagePublicIds.map((pid) =>
                        cloudinary.uploader.destroy(pid)
                    )
                );
            } catch (e) {
                console.error("Error deleting images:", e);
            }
        }

        // ❌ THAY ĐỔI: Xóa hẳn thay vì soft delete
        await AboutModel.findByIdAndDelete(about._id);  // ← Hard delete

        return { 
            status: "OK", 
            message: "Xóa thông tin About Us thành công"
            // ❌ Không trả về data nữa vì đã xóa hẳn
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
    getAboutInfo,           // ✅ Public: Hiển thị trên trang web
    
    // Admin Functions
    createOrUpdateAbout,    // ✅ Admin: Tạo hoặc cập nhật thông tin
    getAboutInfoForAdmin,   // ✅ Admin: Xem thông tin (bao gồm inactive)
    updateAboutStatus,      // ✅ Admin: Cập nhật trạng thái
    updateStats,            // ✅ Admin: Cập nhật thống kê
    deleteAbout             // ✅ Admin: Xóa (soft delete)
};

