const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");
const mongoose = require("mongoose");

const createProduct = async (payload) => {
    try {
        const { name, price, stockQuantity } = payload;
        if (!name || price == null || stockQuantity == null || !payload.category) {
            return { status: "ERR", message: "Missing required fields" };
        }
        // Cho phép nhận category theo tên hoặc ObjectId; yêu cầu status=true
        let categoryDoc = null;
        if (mongoose.isValidObjectId(payload.category)) {
            categoryDoc = await CategoryModel.findOne({ _id: payload.category, status: true });
        } else {
            categoryDoc = await CategoryModel.findOne({ name: payload.category, status: true });
        }
        if (!categoryDoc) return { status: "ERR", message: "Category not found or inactive" };
        payload.category = categoryDoc._id;

        // Chuẩn hoá images từ upload middleware (nếu chỉ có 1 ảnh chuyển thành mảng)
        if (typeof payload.images === "string") {
            payload.images = [payload.images];
        }
        if (typeof payload.imagePublicIds === "string") {
            payload.imagePublicIds = [payload.imagePublicIds];
        }
        // Fallback alias từ form cũ
        if (payload.short_desc === undefined) {
            payload.short_desc = payload.shortDesc ?? payload.description ?? "";
        }
        if (payload.detail_desc === undefined) {
            payload.detail_desc = payload.detailDesc ?? payload.warrantyDetails ?? "";
        }
        // Chuẩn hoá status nếu được gửi kèm
        if (typeof payload.status !== "undefined") {
            payload.status = payload.status === true || payload.status === "true";
        }

        const product = await ProductModel.create(payload);
        return { status: "OK", message: "Product created", data: product };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getProducts = async (query = {}) => {
    try {
        const { page = 1, limit = 20 } = query;
        const filter = {};
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }
        if (typeof query.status !== "undefined") {
            filter.status = query.status === true || query.status === "true";
        }
        // Lọc theo category name nếu truyền categoryName
        const categoryName = (query.categoryName ?? "").toString().trim();
        let categoryFilter = null;
        if (categoryName) {
            const cat = await CategoryModel.findOne({ name: categoryName, status: true }).select("_id");
            if (cat) {
                filter.category = cat._id;
            } else {
                // Không có category phù hợp => trả danh sách rỗng
                const empty = [];
                return { status: "OK", data: empty, pagination: { page: Number(page), limit: Number(limit), total: 0 } };
            }
        }
        const products = await ProductModel.find(filter)
            .populate("category", "name")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await ProductModel.countDocuments(filter);
        const data = products.map((p) => {
            const obj = p.toObject();
            obj.description = obj.short_desc;
            obj.warrantyDetails = obj.detail_desc;
            return obj;
        });
        return { status: "OK", data, pagination: { page: Number(page), limit: Number(limit), total } };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getProductById = async (id) => {
    try {
        const product = await ProductModel.findById(id).populate("category", "name");
        if (!product) return { status: "ERR", message: "Product not found" };
        const obj = product.toObject();
        obj.description = obj.short_desc;
        obj.warrantyDetails = obj.detail_desc;
        return { status: "OK", data: obj };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const updateProduct = async (id, payload) => {
    try {
        if (payload?.category) {
            // Cho phép cập nhật category theo tên hoặc id; yêu cầu status=true
            if (mongoose.isValidObjectId(payload.category)) {
                const cat = await CategoryModel.findOne({ _id: payload.category, status: true });
                if (!cat) return { status: "ERR", message: "Category not found or inactive" };
                payload.category = cat._id;
            } else {
                const cat = await CategoryModel.findOne({ name: payload.category, status: true });
                if (!cat) return { status: "ERR", message: "Category not found or inactive" };
                payload.category = cat._id;
            }
        }
        // Chuẩn hoá images từ upload middleware (nếu chỉ có 1 ảnh chuyển thành mảng)
        if (typeof payload.images === "string") {
            payload.images = [payload.images];
        }
        if (typeof payload.imagePublicIds === "string") {
            payload.imagePublicIds = [payload.imagePublicIds];
        }
        // Fallback alias từ form cũ
        if (payload.short_desc === undefined) {
            payload.short_desc = payload.shortDesc ?? payload.description ?? "";
        }
        if (payload.detail_desc === undefined) {
            payload.detail_desc = payload.detailDesc ?? payload.warrantyDetails ?? "";
        }
        // Chuẩn hoá status nếu được gửi kèm
        if (typeof payload.status !== "undefined") {
            payload.status = payload.status === true || payload.status === "true";
        }

        // Nếu có ảnh mới upload, xóa ảnh cũ trên Cloudinary
        if (Array.isArray(payload.images) && payload.images.length > 0) {
            const existing = await ProductModel.findById(id).select("imagePublicIds");
            if (existing && Array.isArray(existing.imagePublicIds) && existing.imagePublicIds.length > 0) {
                try {
                    await Promise.all(
                        existing.imagePublicIds.map((pid) =>
                            require("../config/cloudinaryConfig").uploader.destroy(pid)
                        )
                    );
                } catch (e) {
                    // Không chặn update nếu xóa ảnh lỗi, nhưng trả thông tin ra message phụ
                }
            }
        }

        const updated = await ProductModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updated) return { status: "ERR", message: "Product not found" };
        return { status: "OK", message: "Product updated", data: updated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const deleteProduct = async (id) => {
    try {
        const existing = await ProductModel.findById(id).select("imagePublicIds");
        const deleted = await ProductModel.findByIdAndDelete(id);
        if (!deleted) return { status: "ERR", message: "Product not found" };
        // Xoá ảnh Cloudinary nếu có
        if (existing && Array.isArray(existing.imagePublicIds) && existing.imagePublicIds.length > 0) {
            try {
                await Promise.all(
                    existing.imagePublicIds.map((pid) =>
                        require("../config/cloudinaryConfig").uploader.destroy(pid)
                    )
                );
            } catch (e) {
                // Bỏ qua lỗi xóa ảnh để không chặn xoá sản phẩm
            }
        }
        return { status: "OK", message: "Product deleted" };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getProductStats = async () => {
    try {
        const [total, visible, hidden] = await Promise.all([
            ProductModel.countDocuments({}),
            ProductModel.countDocuments({ status: true }),
            ProductModel.countDocuments({ status: false }),
        ]);
        return { status: "OK", data: { total, visible, hidden } };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductStats, 
  };


