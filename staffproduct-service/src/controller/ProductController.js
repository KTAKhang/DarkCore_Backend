const ProductService = require("../services/ProductService");
/**
 * CREATE PRODUCT
 */
const create = async (req, res) => {
  console.log("📥 ========= CREATE PRODUCT REQUEST =========");
  console.log("📥 Headers:", req.headers);
  console.log("📥 Content-Type:", req.headers['content-type']);
  console.log("📥 Body:", req.body);
  console.log("📥 Files:", req.files);
  console.log("📥 File count:", req.files?.length);
  try {
    const body = req.body || {};
    const payload = {
      name: body.name,
      price: body.price,
      stockQuantity: body.quantity ?? body.stockQuantity,
      category: body.category_id || body.category, // FE gửi category → BE nhận
      short_desc: body.short_desc,
      detail_desc: body.detail_desc,
      brand: body.brand,
      status: body.status,
      images: req.files?.map(f => f.buffer) || [], // Buffer từ file
    };

    const result = await ProductService.createProduct(payload);
    const code = result.status === "OK" ? 201 : 400;
    return res.status(code).json(result);
  } catch (error) {
    console.error("CREATE CONTROLLER ERROR:", error.message);
    return res.status(500).json({ status: "ERR", message: "Lỗi server: " + error.message });
  }
};

/**
 * LIST PRODUCTS
 */
const list = async (req, res) => {
  try {
    const result = await ProductService.getProducts(req.query);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
  } catch (error) {
    console.error("LIST ERROR:", error);
    return res.status(500).json({ status: "ERR", message: "Lỗi server" });
  }
};

/**
 * GET PRODUCT DETAIL
 */
const detail = async (req, res) => {
  try {
    const result = await ProductService.getProductById(req.params.id);
    const code = result.status === "OK" ? 200 : 404;
    return res.status(code).json(result);
  } catch (error) {
    console.error("DETAIL ERROR:", error);
    return res.status(500).json({ status: "ERR", message: "Lỗi server" });
  }
};

/**
 * UPDATE PRODUCT
 */
const update = async (req, res) => {
  try {
    console.log("UPDATE - req.body:", req.body);
    console.log("UPDATE - req.files:", req.files?.map(f => ({ name: f.originalname, size: f.size })));

    const body = req.body || {};
    const payload = {
      name: body.name,
      price: body.price,
      stockQuantity: body.quantity ?? body.stockQuantity,
      category: body.categoryName ?? body.category_id ?? body.category,
      short_desc: body.short_desc ?? body.shortDesc ?? body.description,
      detail_desc: body.detail_desc ?? body.detailDesc ?? body.warrantyDetails,
      images: req.files?.map(f => f.buffer) || [],
      imagePublicIds: body.imagePublicIds,
      status: body.status,
      brand: body.brand,
    };

    const result = await ProductService.updateProduct(req.params.id, payload);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ status: "ERR", message: "Lỗi server" });
  }
};

/**
 * DELETE PRODUCT
 */
const remove = async (req, res) => {
  try {
    const result = await ProductService.deleteProduct(req.params.id);
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ status: "ERR", message: "Lỗi server" });
  }
};

/**
 * GET PRODUCT STATS
 */
const stats = async (req, res) => {
  try {
    const result = await ProductService.getProductStats();
    const code = result.status === "OK" ? 200 : 400;
    return res.status(code).json(result);
  } catch (error) {
    console.error("STATS ERROR:", error);
    return res.status(500).json({ status: "ERR", message: "Lỗi server" });
  }
};

module.exports = { create, list, detail, update, remove, stats };