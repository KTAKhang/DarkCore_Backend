const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");

const getProductsForHome = async (query = {}) => {
    try {
        const { page = 1, limit = 8 } = query;
        const filter = { status: true }; // Chỉ lấy products có status = true
        
        // Tìm kiếm theo tên sản phẩm
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }
        
        // Lọc theo category name nếu truyền categoryName
        const categoryName = (query.categoryName ?? "").toString().trim();
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

        // Lọc theo brand
        const brand = (query.brand ?? "").toString().trim();
        if (brand && brand !== "all" && brand !== "") {
            // Sử dụng case-insensitive regex match
            filter.brand = { $regex: new RegExp(`^${brand}$`, "i") };
        }

        // Lọc theo khoảng giá
        if (query.minPrice !== undefined && query.minPrice !== "") {
            filter.price = { ...filter.price, $gte: Number(query.minPrice) };
        }
        if (query.maxPrice !== undefined && query.maxPrice !== "") {
            filter.price = { ...filter.price, $lte: Number(query.maxPrice) };
        }

        // Lọc theo favorite
        if (query.favorite !== undefined && query.favorite !== "") {
            filter.favorite = query.favorite === "true" || query.favorite === true;
        }

        // Xử lý sort
        let sortOption = { createdAt: -1 }; // Mặc định sort theo thời gian tạo mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "price") {
            sortOption = { price: sortOrder === "desc" ? -1 : 1 };
        } else if (sortBy === "name") {
            sortOption = { name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        }


        // Populate category với điều kiện category cũng phải có status = true
        const products = await ProductModel.find(filter)
            .populate({
                path: "category",
                match: { status: true }, // Chỉ populate categories có status = true
                select: "name status"
            })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        
        // Lọc bỏ các products có category null (do category bị ẩn)
        const validProducts = products.filter(product => product.category !== null);
        
        const total = await ProductModel.countDocuments(filter);
        
        
        const data = validProducts.map((p) => {
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

const getProductByIdForHome = async (id) => {
    try {
        // Chỉ lấy product có status = true và category cũng có status = true
        const product = await ProductModel.findOne({ _id: id, status: true })
            .populate({
                path: "category",
                match: { status: true },
                select: "name status"
            });
        
        if (!product || !product.category) {
            return { status: "ERR", message: "Không tìm thấy sản phẩm hoặc sản phẩm đang bị ẩn" };
        }
        
        const obj = product.toObject();
        obj.description = obj.short_desc;
        obj.warrantyDetails = obj.detail_desc;
        return { status: "OK", data: obj };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getFeaturedProducts = async (limit = 8) => {
    try {
        // Lấy các sản phẩm nổi bật (có thể mở rộng logic này sau)
        const products = await ProductModel.find({ status: true })
            .populate({
                path: "category",
                match: { status: true },
                select: "name status"
            })
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        
        // Lọc bỏ các products có category null
        const validProducts = products.filter(product => product.category !== null);
        
        const data = validProducts.map((p) => {
            const obj = p.toObject();
            obj.description = obj.short_desc;
            obj.warrantyDetails = obj.detail_desc;
            return obj;
        });
        
        return { status: "OK", data };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getProductsByCategoryForHome = async (categoryId, query = {}) => {
    try {
        const { page = 1, limit = 8 } = query;
        
        // Kiểm tra category có tồn tại và có status = true
        const category = await CategoryModel.findOne({ _id: categoryId, status: true });
        if (!category) {
            return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
        }
        
        const filter = { 
            status: true, 
            category: categoryId 
        };
        
        // Tìm kiếm theo tên sản phẩm trong category
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }
        
        // Lọc theo brand
        const brand = (query.brand ?? "").toString().trim();
        if (brand && brand !== "all" && brand !== "") {
            filter.brand = { $regex: new RegExp(`^${brand}$`, "i") };
        }
        
        // Lọc theo khoảng giá
        if (query.minPrice !== undefined && query.minPrice !== "") {
            filter.price = { ...filter.price, $gte: Number(query.minPrice) };
        }
        if (query.maxPrice !== undefined && query.maxPrice !== "") {
            filter.price = { ...filter.price, $lte: Number(query.maxPrice) };
        }
        
        // Xử lý sort
        let sortOption = { createdAt: -1 };
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "price") {
            sortOption = { price: sortOrder === "desc" ? -1 : 1 };
        } else if (sortBy === "name") {
            sortOption = { name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        }
        
        const products = await ProductModel.find(filter)
            .populate("category", "name status")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        
        const total = await ProductModel.countDocuments(filter);
        
        const data = products.map((p) => {
            const obj = p.toObject();
            obj.description = obj.short_desc;
            obj.warrantyDetails = obj.detail_desc;
            return obj;
        });
        
        return { 
            status: "OK", 
            data, 
            pagination: { page: Number(page), limit: Number(limit), total },
            category: { id: category._id, name: category.name }
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Function để lấy danh sách brands
const getBrands = async () => {
    try {
        // Lấy tất cả brands unique từ products có status = true
        const brands = await ProductModel.distinct("brand", { status: true });
        
        // Lọc bỏ null, undefined và empty strings
        const validBrands = brands.filter(brand => brand && brand.trim() !== "");
        
        return { status: "OK", data: validBrands };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// Function để lấy danh sách sản phẩm yêu thích
const getFavoriteProducts = async (query = {}) => {
    try {
        const { page = 1, limit = 8 } = query;
        
        // Chỉ lấy products có status = true và favorite = true
        const filter = { status: true, favorite: true };
        
        // Tìm kiếm theo tên sản phẩm
        const keyword = (query.keyword ?? query.name ?? "").toString().trim();
        if (keyword) {
            filter.name = { $regex: keyword, $options: "i" };
        }
        
        // Lọc theo category name nếu truyền categoryName
        const categoryName = (query.categoryName ?? "").toString().trim();
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

        // Lọc theo brand
        const brand = (query.brand ?? "").toString().trim();
        if (brand && brand !== "all" && brand !== "") {
            filter.brand = { $regex: new RegExp(`^${brand}$`, "i") };
        }

        // Lọc theo khoảng giá
        if (query.minPrice !== undefined && query.minPrice !== "") {
            filter.price = { ...filter.price, $gte: Number(query.minPrice) };
        }
        if (query.maxPrice !== undefined && query.maxPrice !== "") {
            filter.price = { ...filter.price, $lte: Number(query.maxPrice) };
        }

        // Xử lý sort
        let sortOption = { createdAt: -1 };
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "price") {
            sortOption = { price: sortOrder === "desc" ? -1 : 1 };
        } else if (sortBy === "name") {
            sortOption = { name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        }

        // Populate category với điều kiện category cũng phải có status = true
        const products = await ProductModel.find(filter)
            .populate({
                path: "category",
                match: { status: true },
                select: "name status"
            })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        
        // Lọc bỏ các products có category null (do category bị ẩn)
        const validProducts = products.filter(product => product.category !== null);
        
        const total = await ProductModel.countDocuments(filter);
        
        const data = validProducts.map((p) => {
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

// Function để toggle favorite status của sản phẩm
const toggleFavorite = async (productId) => {
    try {
        const product = await ProductModel.findOne({ _id: productId, status: true });
        
        if (!product) {
            return { status: "ERR", message: "Không tìm thấy sản phẩm hoặc sản phẩm đang bị ẩn" };
        }
        
        // Toggle favorite status
        product.favorite = !product.favorite;
        await product.save();
        
        const obj = product.toObject();
        obj.description = obj.short_desc;
        obj.warrantyDetails = obj.detail_desc;
        
        return { 
            status: "OK", 
            data: obj, 
            message: product.favorite ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi danh sách yêu thích" 
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    getProductsForHome,
    getProductByIdForHome,
    getFeaturedProducts,
    getProductsByCategoryForHome,
    getBrands,
    getFavoriteProducts,
    toggleFavorite,
};