const CategoryService = require("../services/CategoryService");

const create = async (req, res) => {
    const { name, description, image, imagePublicId, status } = req.body;
    const result = await CategoryService.createCategory({ name, description, image, imagePublicId, status });
    const code = result.status === "OK" ? 201 : 400;
    return res.status(code).json(result);
};

const list = async (req, res) => {
    const result = await CategoryService.getCategories(req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const detail = async (req, res) => {
    const result = await CategoryService.getCategoryById(req.params.id);
    const code = result.status === "OK" ? 200 : 404;
    return res.status(code).json(result);
};

const update = async (req, res) => {
    const result = await CategoryService.updateCategory(req.params.id, req.body);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const remove = async (req, res) => {
    const result = await CategoryService.deleteCategory(req.params.id);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const stats = async (req, res) => {
    const result = await CategoryService.getCategoryStats();
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

module.exports = { create, list, detail, update, remove, stats };


