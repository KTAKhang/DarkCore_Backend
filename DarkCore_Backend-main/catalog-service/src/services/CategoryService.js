const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");

const createCategory = async ({ name, description = "", image = "", imagePublicId = "", status }) => {
    try {
        const exists = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (exists) return { status: "ERR", message: "Category name already exists" };

        const payload = { name, description, image };
        if (imagePublicId) payload.imagePublicId = imagePublicId;
        if (typeof status !== "undefined") {
            payload.status = status === true || status === "true";
        }

        const category = await CategoryModel.create(payload);
        return { status: "OK", message: "Category created", data: category };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategories = async (query = {}) => {
    try {
        const filter = {};
        if (typeof query.status !== "undefined") {
            const normalized = query.status === true || query.status === "true";
            filter.status = normalized;
        }
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }
        const categories = await CategoryModel.find(filter).sort({ createdAt: -1 });
        return { status: "OK", data: categories };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategoryById = async (id) => {
    try {
        const category = await CategoryModel.findById(id);
        if (!category) return { status: "ERR", message: "Category not found" };
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
            if (exists) return { status: "ERR", message: "Category name already exists" };
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
        if (!updated) return { status: "ERR", message: "Category not found" };
        return { status: "OK", message: "Category updated", data: updated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const deleteCategory = async (id) => {
    try {
        const productCount = await ProductModel.countDocuments({ category: id });
        if (productCount > 0) {
            return { status: "ERR", message: "Cannot delete category with existing products" };
        }
        const existing = await CategoryModel.findById(id).select("imagePublicId");
        const deleted = await CategoryModel.findByIdAndDelete(id);
        if (!deleted) return { status: "ERR", message: "Category not found" };
        if (existing && existing.imagePublicId) {
            try {
                await require("../config/cloudinaryConfig").uploader.destroy(existing.imagePublicId);
            } catch (e) {
                // Bỏ qua lỗi xóa ảnh
            }
        }
        return { status: "OK", message: "Category deleted" };
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


