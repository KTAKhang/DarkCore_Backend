const FavoriteService = require("../services/FavoriteService");

// Thêm sản phẩm vào danh sách yêu thích
const addFavorite = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id; // Lấy từ JWT middleware
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        if (!productId) {
            return res.status(400).json({ status: "ERR", message: "Product ID là bắt buộc" });
        }

        const result = await FavoriteService.addFavorite(userId, productId);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Xóa sản phẩm khỏi danh sách yêu thích
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        const result = await FavoriteService.removeFavorite(userId, productId);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Toggle favorite
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        const result = await FavoriteService.toggleFavorite(userId, productId);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Lấy danh sách yêu thích của user
const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        const result = await FavoriteService.getFavoritesByUser(userId, req.query);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
const checkFavorite = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        const result = await FavoriteService.checkIsFavorite(userId, productId);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Kiểm tra danh sách sản phẩm nào là favorite
const checkMultipleFavorites = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { productIds } = req.body; // Array of product IDs

        if (!userId) {
            return res.status(401).json({ status: "ERR", message: "Chưa đăng nhập" });
        }

        if (!productIds || !Array.isArray(productIds)) {
            return res.status(400).json({ status: "ERR", message: "productIds phải là một mảng" });
        }

        const result = await FavoriteService.checkMultipleFavorites(userId, productIds);
        const code = result.status === "OK" ? 200 : 400;
        return res.status(code).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavorites,
    checkFavorite,
    checkMultipleFavorites,
};

