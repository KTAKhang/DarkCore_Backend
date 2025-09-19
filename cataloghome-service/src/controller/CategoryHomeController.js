const CategoryHomeService = require("../services/CategoryHomeService");

const list = async (req, res) => {
    const result = await CategoryHomeService.getCategoriesForHome(req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const detail = async (req, res) => {
    const result = await CategoryHomeService.getCategoryByIdForHome(req.params.id);
    const code = result.status === "OK" ? 200 : 404;
    return res.status(code).json(result);
};

const featured = async (req, res) => {
    const { limit = 6 } = req.query;
    const result = await CategoryHomeService.getFeaturedCategories(limit);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

module.exports = { list, detail, featured };
