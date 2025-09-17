const ProductService = require("../services/ProductService");

const create = async (req, res) => {
    const body = req.body || {};
    const payload = {
        name: body.name,
        price: body.price,
        stockQuantity: body.quantity ?? body.stockQuantity,
        category: body.categoryName ?? body.category_id ?? body.category,
        short_desc: body.short_desc ?? body.shortDesc ?? body.description,
        detail_desc: body.detail_desc ?? body.detailDesc ?? body.warrantyDetails,
        images: body.images,
        imagePublicIds: body.imagePublicIds,
        status: body.status,
        brand: body.brand,
    };
    const result = await ProductService.createProduct(payload);
    const code = result.status === "OK" ? 201 : 400;
    return res.status(code).json(result);
};

const list = async (req, res) => {
    const result = await ProductService.getProducts(req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const detail = async (req, res) => {
    const result = await ProductService.getProductById(req.params.id);
    const code = result.status === "OK" ? 200 : 404;
    return res.status(code).json(result);
};

const update = async (req, res) => {
    const body = req.body || {};
    const payload = {
        name: body.name,
        price: body.price,
        stockQuantity: body.quantity ?? body.stockQuantity,
        category: body.categoryName ?? body.category_id ?? body.category,
        short_desc: body.short_desc ?? body.shortDesc ?? body.description,
        detail_desc: body.detail_desc ?? body.detailDesc ?? body.warrantyDetails,
        images: body.images,
        imagePublicIds: body.imagePublicIds,
        status: body.status,
        brand: body.brand,
    };
    const result = await ProductService.updateProduct(req.params.id, payload);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const remove = async (req, res) => {
    const result = await ProductService.deleteProduct(req.params.id);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

const stats = async (req, res) => {
    const result = await ProductService.getProductStats();
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
};

module.exports = { create, list, detail, update, remove, stats };


