const FavoriteModel = require("../models/FavoriteModel");
const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");

// Thêm sản phẩm vào danh sách yêu thích
const addFavorite = async (userId, productId) => {
    try {
        // Kiểm tra sản phẩm có tồn tại và có status = true
        const product = await ProductModel.findOne({ _id: productId, status: true });
        if (!product) {
            return { status: "ERR", message: "Không tìm thấy sản phẩm hoặc sản phẩm đang bị ẩn" };
        }

        // Kiểm tra xem đã tồn tại chưa
        const existingFavorite = await FavoriteModel.findOne({ user_id: userId, product_id: productId });
        if (existingFavorite) {
            return { status: "ERR", message: "Sản phẩm đã có trong danh sách yêu thích" };
        }

        // Thêm vào danh sách yêu thích
        const favorite = await FavoriteModel.create({
            user_id: userId,
            product_id: productId,
        });

        return { status: "OK", data: favorite, message: "Đã thêm vào danh sách yêu thích" };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Xóa sản phẩm khỏi danh sách yêu thích
const removeFavorite = async (userId, productId) => {
    try {
        const favorite = await FavoriteModel.findOneAndDelete({
            user_id: userId,
            product_id: productId,
        });

        if (!favorite) {
            return { status: "ERR", message: "Sản phẩm không có trong danh sách yêu thích" };
        }

        return { status: "OK", message: "Đã xóa khỏi danh sách yêu thích" };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Toggle favorite (thêm nếu chưa có, xóa nếu đã có)
const toggleFavorite = async (userId, productId) => {
    try {
        // Kiểm tra sản phẩm có tồn tại và có status = true
        const product = await ProductModel.findOne({ _id: productId, status: true });
        if (!product) {
            return { status: "ERR", message: "Không tìm thấy sản phẩm hoặc sản phẩm đang bị ẩn" };
        }

        // Kiểm tra xem đã tồn tại chưa
        const existingFavorite = await FavoriteModel.findOne({ user_id: userId, product_id: productId });

        if (existingFavorite) {
            // Đã tồn tại => xóa
            await FavoriteModel.findByIdAndDelete(existingFavorite._id);
            return { status: "OK", isFavorite: false, message: "Đã xóa khỏi danh sách yêu thích" };
        } else {
            // Chưa tồn tại => thêm
            await FavoriteModel.create({
                user_id: userId,
                product_id: productId,
            });
            return { status: "OK", isFavorite: true, message: "Đã thêm vào danh sách yêu thích" };
        }
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Lấy danh sách sản phẩm yêu thích của user
const getFavoritesByUser = async (userId, query = {}) => {
    try {
        const { page = 1, limit = 8 } = query;

        // Tìm tất cả favorite của user
        const favorites = await FavoriteModel.find({ user_id: userId })
            .populate({
                path: "product_id",
                match: { status: true }, // Chỉ lấy products có status = true
                populate: {
                    path: "category",
                    match: { status: true }, // Chỉ lấy categories có status = true
                    select: "name status",
                },
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Lọc bỏ các favorites có product null (do product bị ẩn)
        const validFavorites = favorites.filter(
            (fav) => fav.product_id !== null && fav.product_id.category !== null
        );

        // Áp dụng các filter bổ sung
        let products = validFavorites.map((fav) => fav.product_id);

        // Tìm kiếm theo tên sản phẩm
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            products = products.filter((p) =>
                p.name.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        // Lọc theo brand
        const brand = (query.brand ?? "").toString().trim();
        if (brand && brand !== "all" && brand !== "") {
            products = products.filter(
                (p) => p.brand && p.brand.toLowerCase() === brand.toLowerCase()
            );
        }

        // Lọc theo khoảng giá
        if (query.minPrice !== undefined && query.minPrice !== "") {
            products = products.filter((p) => p.price >= Number(query.minPrice));
        }
        if (query.maxPrice !== undefined && query.maxPrice !== "") {
            products = products.filter((p) => p.price <= Number(query.maxPrice));
        }

        // Xử lý sort
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();

        if (sortBy === "price") {
            products.sort((a, b) =>
                sortOrder === "desc" ? b.price - a.price : a.price - b.price
            );
        } else if (sortBy === "name") {
            products.sort((a, b) =>
                sortOrder === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
            );
        }

        // Đếm tổng số favorites của user (chỉ những product còn active)
        const allFavorites = await FavoriteModel.find({ user_id: userId }).populate({
            path: "product_id",
            match: { status: true },
        });
        const total = allFavorites.filter((fav) => fav.product_id !== null).length;

        // Map data
        const data = products.map((p) => {
            const obj = p.toObject();
            obj.description = obj.short_desc;
            obj.warrantyDetails = obj.detail_desc;
            obj.isFavorite = true; // Đánh dấu là yêu thích
            return obj;
        });

        return {
            status: "OK",
            data,
            pagination: { page: Number(page), limit: Number(limit), total },
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích của user không
const checkIsFavorite = async (userId, productId) => {
    try {
        const favorite = await FavoriteModel.findOne({
            user_id: userId,
            product_id: productId,
        });

        return { status: "OK", isFavorite: !!favorite };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Kiểm tra danh sách sản phẩm nào là favorite của user
const checkMultipleFavorites = async (userId, productIds) => {
    try {
        const favorites = await FavoriteModel.find({
            user_id: userId,
            product_id: { $in: productIds },
        }).select("product_id");

        const favoriteProductIds = favorites.map((fav) => fav.product_id.toString());

        return { status: "OK", data: favoriteProductIds };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoritesByUser,
    checkIsFavorite,
    checkMultipleFavorites,
};

