const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");

const createCategory = async ({ name, description = "", image = "", imagePublicId = "", status }) => {
    try {
        const exists = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (exists) return { status: "ERR", message: "Tên danh mục đã tồn tại" };

        const payload = { name, description, image };
        if (imagePublicId) payload.imagePublicId = imagePublicId;
        if (typeof status !== "undefined") {
            payload.status = status === true || status === "true";
        }

        const category = await CategoryModel.create(payload);
        return { status: "OK", message: "Danh mục đã được tạo thành công", data: category };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategories = async (query = {}) => {
    try {
        console.log("=== Backend getCategories Debug ===");
        console.log("Received query:", query);
        console.log("sortBy:", query.sortBy);
        console.log("sortOrder:", query.sortOrder);
        
        const { page = 1, limit = 5 } = query;
        const filter = {};
        if (typeof query.status !== "undefined") {
            const normalized = query.status === true || query.status === "true";
            filter.status = normalized;
        }
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }

        // Xử lý sort theo ngày tạo
        let sortOption = { createdAt: -1 }; // Mặc định sort theo thời gian tạo mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        console.log("=== Category Sort Processing ===");
        console.log("sortBy processed:", sortBy);
        console.log("sortOrder processed:", sortOrder);
        
        if (sortBy === "createdat" || sortBy === "created") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
            console.log("Setting sort to createdAt:", sortOption);
        } else {
            // Nếu không có sortBy hoặc sortBy không hợp lệ, dùng mặc định
            sortOption = { createdAt: -1 };
            console.log("Using default sort:", sortOption);
        }

        console.log("Final sortOption:", sortOption);

        const categories = await CategoryModel.find(filter)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await CategoryModel.countDocuments(filter);
        
        console.log("=== Category Query Results ===");
        console.log("Found categories:", categories.length);
        if (categories.length > 0) {
            console.log("First category createdAt:", categories[0]?.createdAt);
            console.log("Last category createdAt:", categories[categories.length - 1]?.createdAt);
        }
        
        return { 
            status: "OK", 
            data: categories, 
            pagination: { page: Number(page), limit: Number(limit), total } 
        };
    } catch (error) {
        console.log("=== Category Backend Error ===");
        console.log("Error:", error.message);
        return { status: "ERR", message: error.message };
    }
};

const getCategoryById = async (id) => {
    try {
        const category = await CategoryModel.findById(id);
        if (!category) return { status: "ERR", message: "Không tìm thấy danh mục" };
        return { status: "OK", data: category };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const updateCategory = async (id, payload) => {
    try {
        if (payload?.name) {
            const exists = await CategoryModel.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${payload.name}$`, "i") },
            });
            if (exists) return { status: "ERR", message: "Tên danh mục đã tồn tại" };
        }

        if (typeof payload.status !== "undefined") {
            payload.status = payload.status === true || payload.status === "true";
        }

        // Nếu có ảnh mới, xoá ảnh cũ trên Cloudinary
        if (payload.image) {
            const existing = await CategoryModel.findById(id).select("imagePublicId");
            if (existing && existing.imagePublicId) {
                try {
                    await require("../config/cloudinaryConfig").uploader.destroy(existing.imagePublicId);
                } catch (e) {
                    // Bỏ qua lỗi xóa ảnh
                }
            }
        }

        const updated = await CategoryModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updated) return { status: "ERR", message: "Không tìm thấy danh mục" };
        return { status: "OK", message: "Danh mục đã được cập nhật thành công", data: updated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const deleteCategory = async (id) => {
    try {
        const productCount = await ProductModel.countDocuments({ category: id });
        if (productCount > 0) {
            return { status: "ERR", message: "Không thể xóa danh mục có sản phẩm" };
        }
        const existing = await CategoryModel.findById(id).select("imagePublicId");
        const deleted = await CategoryModel.findByIdAndDelete(id);
        if (!deleted) return { status: "ERR", message: "Không tìm thấy danh mục" };
        if (existing && existing.imagePublicId) {
            try {
                await require("../config/cloudinaryConfig").uploader.destroy(existing.imagePublicId);
            } catch (e) {
                // Bỏ qua lỗi xóa ảnh
            }
        }
        return { status: "OK", message: "Danh mục đã được xóa thành công" };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategoryStats = async () => {
    try {
        const [total, visible, hidden] = await Promise.all([
            CategoryModel.countDocuments({}),
            CategoryModel.countDocuments({ status: true }),
            CategoryModel.countDocuments({ status: false }),
        ]);
        return { status: "OK", data: { total, visible, hidden } };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryStats,
};