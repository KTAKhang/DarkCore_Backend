const ProductHomeService = require("../services/ProductHomeService");

const list = async (req, res) => {
    const result = await ProductHomeService.getProductsForHome(req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const detail = async (req, res) => {
    const result = await ProductHomeService.getProductByIdForHome(req.params.id);
    const code = result.status === "OK" ? 200 : 404;
    return res.status(code).json(result);
};

const featured = async (req, res) => {
    const { limit = 8 } = req.query;
    const result = await ProductHomeService.getFeaturedProducts(limit);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const getByCategory = async (req, res) => {
    const { categoryId } = req.params;
    const result = await ProductHomeService.getProductsByCategoryForHome(categoryId, req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

// THÊM CONTROLLER METHOD MỚI
const brands = async (req, res) => {
    const result = await ProductHomeService.getBrands();
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

module.exports = { 
    list, 
    detail, 
    featured, 
    getByCategory, 
    brands 
};