const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");
const mongoose = require("mongoose");

const createProduct = async (payload) => {
    try {
        const { name, price, stockQuantity } = payload;
        if (!name || price == null || stockQuantity == null || !payload.category) {
            return { status: "ERR", message: "Thiếu các trường bắt buộc" };
        }
        // Cho phép nhận category theo tên hoặc ObjectId; yêu cầu status=true
        let categoryDoc = null;
        if (mongoose.isValidObjectId(payload.category)) {
            categoryDoc = await CategoryModel.findOne({ _id: payload.category, status: true });
        } else {
            categoryDoc = await CategoryModel.findOne({ name: payload.category, status: true });
        }
        if (!categoryDoc) return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
        payload.category = categoryDoc._id;

        // ✅ FIX: Xử lý images từ upload middleware hoặc frontend
        if (payload.images) {
            if (typeof payload.images === "string") {
                // Kiểm tra nếu là JSON string
                try {
                    const parsed = JSON.parse(payload.images);
                    payload.images = parsed; // Giữ nguyên parsed data
                } catch (e) {
                    // Không phải JSON, là URL string thông thường
                    payload.images = [payload.images];
                }
            }
            
            // ✅ Xử lý trường hợp object với uid (không có URL thực tế)
            if (Array.isArray(payload.images)) {
                const processedImages = payload.images.map(img => {
                    if (typeof img === "string") {
                        return img; // URL string từ Cloudinary
                    } else if (typeof img === "object" && img.url) {
                        return img.url; // Object có URL
                    } else if (typeof img === "object" && img.uid) {
                        // Object chỉ có uid - tạo placeholder URL hoặc bỏ qua
                        return `placeholder-${img.uid}`; // Placeholder URL
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
                // Xử lý array of objects từ frontend
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
        // ✅ FIX: Populate category để trả về đầy đủ thông tin category như API getProducts
        const populatedProduct = await ProductModel.findById(product._id).populate("category", "name status");
        return { status: "OK", message: "Sản phẩm đã được tạo thành công", data: populatedProduct };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getProducts = async (query = {}) => {
    try {
        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 5), 100); // Tối đa 100 items/trang
        
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
                return { 
                    status: "OK", 
                    data: empty, 
                    pagination: { 
                        page, 
                        limit, 
                        total: 0, 
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false
                    } 
                };
            }
        }

        // Xử lý sort theo giá sản phẩm và ngày tạo
        let sortOption = { createdAt: -1 }; // ✅ Mặc định KHÔNG sort gì cả
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "").toString().trim().toLowerCase();
        
        // ✅ Validation sortBy và sortOrder - Hỗ trợ trạng thái "mặc định"
        const validSortFields = ["price", "createdat", "created", "name", "default", "none"];
        const validSortOrders = ["asc", "desc"];
        
        // ✅ FIX: Logic validation cải thiện - chỉ cần sortBy hợp lệ, sortOrder có thể mặc định
        const isValidSortBy = validSortFields.includes(sortBy);
        const isValidSortOrder = validSortOrders.includes(sortOrder);
        
        // ✅ FIX: Xử lý sort logic với trạng thái mặc định
        if (sortBy === "default" || sortBy === "none" || sortBy === "" || !sortBy || !isValidSortBy) {
            // Trạng thái mặc định - KHÔNG sort gì cả
            sortOption = {};
        } else {
            // Có sortBy hợp lệ, xử lý sort
            let actualSortOrder = "asc"; // Mặc định asc nếu sortOrder không hợp lệ
            if (isValidSortOrder) {
                actualSortOrder = sortOrder;
            }
            
            if (sortBy === "price") {
                sortOption = { price: actualSortOrder === "desc" ? -1 : 1 };
            } else if (sortBy === "createdat" || sortBy === "created") {
                sortOption = { createdAt: actualSortOrder === "desc" ? -1 : 1 };
            } else if (sortBy === "name") {
                sortOption = { name: actualSortOrder === "desc" ? -1 : 1 };
            } else {
                // Fallback - không sort
                sortOption = {};
            }
        }

        // ✅ FIX: Populate đầy đủ category data bao gồm status
        const products = await ProductModel.find(filter)
            .populate("category", "name status") // Thêm status vào populate
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await ProductModel.countDocuments(filter);
        
        const data = products.map((p) => {
            const obj = p.toObject();
            obj.description = obj.short_desc;
            obj.warrantyDetails = obj.detail_desc;
            return obj;
        });
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return { 
            status: "OK", 
            data, 
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

const getProductById = async (id) => {
    try {
        // ✅ FIX: Populate đầy đủ category data bao gồm status
        const product = await ProductModel.findById(id).populate("category", "name status");
        if (!product) return { status: "ERR", message: "Không tìm thấy sản phẩm" };
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
                if (!cat) return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
                payload.category = cat._id;
            } else {
                const cat = await CategoryModel.findOne({ name: payload.category, status: true });
                if (!cat) return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
                payload.category = cat._id;
            }
        }
        // ✅ FIX: Xử lý images từ upload middleware hoặc frontend
        if (payload.images) {
            if (typeof payload.images === "string") {
                // Kiểm tra nếu là JSON string
                try {
                    const parsed = JSON.parse(payload.images);
                    payload.images = parsed; // Giữ nguyên parsed data
                } catch (e) {
                    // Không phải JSON, là URL string thông thường
                    payload.images = [payload.images];
                }
            }
            
            // ✅ Xử lý trường hợp object với uid (không có URL thực tế)
            if (Array.isArray(payload.images)) {
                const processedImages = payload.images.map(img => {
                    if (typeof img === "string") {
                        return img; // URL string từ Cloudinary
                    } else if (typeof img === "object" && img.url) {
                        return img.url; // Object có URL
                    } else if (typeof img === "object" && img.uid) {
                        // Object chỉ có uid - tạo placeholder URL hoặc bỏ qua
                        return `placeholder-${img.uid}`; // Placeholder URL
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
                // Xử lý array of objects từ frontend
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
        if (!updated) return { status: "ERR", message: "Không tìm thấy sản phẩm" };
        // ✅ FIX: Populate category để trả về đầy đủ thông tin category như API getProducts
        const populatedUpdated = await ProductModel.findById(updated._id).populate("category", "name status");
        return { status: "OK", message: "Sản phẩm đã được cập nhật thành công", data: populatedUpdated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const deleteProduct = async (id) => {
    try {
        const existing = await ProductModel.findById(id).select("imagePublicIds");
        const deleted = await ProductModel.findByIdAndDelete(id);
        if (!deleted) return { status: "ERR", message: "Không tìm thấy sản phẩm" };
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
        return { status: "OK", message: "Sản phẩm đã được xóa thành công" };
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