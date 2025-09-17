const CategoryModel = require("../models/CategoryModel");

const getCategoriesForHome = async (query = {}) => {
    try {
        const { page = 1, limit = 8 } = query;
        
        // Chỉ lấy categories có status = true (visible)
        const filter = { status: true };
        
        // Tìm kiếm theo tên category
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }

        // Xử lý sort
        let sortOption = { createdAt: -1 }; // Mặc định sort theo thời gian tạo mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "name") {
            sortOption = { name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        } else {
            // Nếu không có sortBy hoặc sortBy không hợp lệ, dùng mặc định
            sortOption = { createdAt: -1 };
        }

        const categories = await CategoryModel.find(filter)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await CategoryModel.countDocuments(filter);
        
        return { 
            status: "OK", 
            data: categories, 
            pagination: { page: Number(page), limit: Number(limit), total } 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getCategoryByIdForHome = async (id) => {
    try {
        // Chỉ lấy category có status = true
        const category = await CategoryModel.findOne({ _id: id, status: true });
        if (!category) return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
        return { status: "OK", data: category };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getFeaturedCategories = async (limit = 6) => {
    try {
        // Lấy các categories nổi bật (có thể mở rộng logic này sau)
        const categories = await CategoryModel.find({ status: true })
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        
        return { status: "OK", data: categories };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    getCategoriesForHome,
    getCategoryByIdForHome,
    getFeaturedCategories,
};
