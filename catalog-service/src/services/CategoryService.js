const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildExactMatchRegex = (value = "") => new RegExp(`^${escapeRegex(value)}$`, "i");
const normalizeBoolean = (value) => value === true || value === "true";

const createCategory = async ({ name, description = "", image = "", imagePublicId = "", status }) => {
    try {
        if (!name) {
            return { status: "ERR", message: "Thiếu tên danh mục" };
        }
        const normalizedName = name.toString().trim();
        if (!normalizedName) {
            return { status: "ERR", message: "Tên danh mục không hợp lệ" };
        }
        const exists = await CategoryModel.findOne({ name: { $regex: buildExactMatchRegex(normalizedName) } });
        if (exists) return { status: "ERR", message: "Tên danh mục đã tồn tại" };

        const payload = {
            name: normalizedName,
            description: description?.toString().trim() ?? "",
            image: image?.toString().trim() ?? "",
        };
        if (imagePublicId) payload.imagePublicId = imagePublicId;
        if (typeof status !== "undefined") {
            payload.status = normalizeBoolean(status);
        }

        const category = await CategoryModel.create(payload);
        return { status: "OK", message: "Danh mục đã được tạo thành công", data: category };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategories = async (query = {}) => {
    try {
        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 5), 100); // Tối đa 100 items/trang
        
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
        let sortOption = {}; // ✅ Mặc định KHÔNG sort gì cả
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "").toString().trim().toLowerCase();
        
        // ✅ Validation sortBy và sortOrder - Hỗ trợ trạng thái "mặc định"
        const validSortFields = ["createdat", "created", "createdat", "name", "default", "none"];
        const validSortOrders = ["asc", "desc"];
        
        const isValidSortBy = validSortFields.includes(sortBy);
        const isValidSortOrder = validSortOrders.includes(sortOrder);
        
        // ✅ FIX: Xử lý sort logic với trạng thái mặc định
        if (sortBy === "default" || sortBy === "none" || sortBy === "" || !sortBy) {
            // Trạng thái mặc định - KHÔNG sort gì cả
            sortOption = {};
        } else if (isValidSortBy && isValidSortOrder) {
            if (
                sortBy === "createdat" ||
                sortBy === "created" ||
                sortBy === "createdat"
            ) {
                sortOption = { createdAt: sortOrder === "desc" ? -1 : 1 };
            } else if (sortBy === "name") {
                sortOption = { name: sortOrder === "desc" ? -1 : 1 };
            }
        } else {
            // Nếu không có sortBy hoặc sortBy không hợp lệ, dùng mặc định (không sort)
            sortOption = {};
        }

        const categories = await CategoryModel.find(filter)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await CategoryModel.countDocuments(filter);
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return { 
            status: "OK", 
            data: categories, 
            pagination: { 
                page, 
                limit, 
                total, 
                totalPages,
                hasNextPage,
                hasPrevPage
            } 
        };
    } catch (error) {
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
            const normalizedName = payload.name.toString().trim();
            if (!normalizedName) {
                return { status: "ERR", message: "Tên danh mục không hợp lệ" };
            }
            const exists = await CategoryModel.findOne({
                _id: { $ne: id },
                name: { $regex: buildExactMatchRegex(normalizedName) },
            });
            if (exists) return { status: "ERR", message: "Tên danh mục đã tồn tại" };
            payload.name = normalizedName;
        }

        if (typeof payload.status !== "undefined") {
            payload.status = normalizeBoolean(payload.status);
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