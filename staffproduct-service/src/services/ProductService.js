// src/services/ProductService.js
const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinaryConfig").uploader;

/**
 * CREATE PRODUCT
 */
const createProduct = async (payload) => {
  console.log("createProduct START - payload:", {
    name: payload.name,
    price: payload.price,
    stockQuantity: payload.quantity ?? payload.stockQuantity,
    category: payload.category,
    imagesCount: payload.images?.length ?? 0,
    brand: payload.brand,
    status: payload.status,
  });

  try {
    const { name, price, stockQuantity } = payload;
    if (!name || price == null || stockQuantity == null || !payload.category) {
      console.log("createProduct ERR: Thiếu trường bắt buộc");
      return { status: "ERR", message: "Thiếu các trường bắt buộc" };
    }

    let categoryDoc = null;
    if (mongoose.isValidObjectId(payload.category)) {
      console.log("Tìm category bằng ID:", payload.category);
      categoryDoc = await CategoryModel.findOne({ _id: payload.category, status: true });
    } else {
      console.log("Tìm category bằng tên:", payload.category);
      categoryDoc = await CategoryModel.findOne({ name: payload.category, status: true });
    }

    if (!categoryDoc) {
      console.log("createProduct ERR: Danh mục không tồn tại hoặc bị ẩn");
      return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
    }
    payload.category = categoryDoc._id;
    console.log("categoryDoc._id:", categoryDoc._id.toString());

    let uploadedImages = [];
    let imagePublicIds = [];

    if (payload.images && payload.images.length > 0) {
      console.log(`[CREATE] Bắt đầu upload ${payload.images.length} ảnh lên Cloudinary...`);

      const uploadPromises = payload.images.map((imgBuffer, index) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.upload_stream(
            { folder: "products", public_id: `product_${Date.now()}_${index}` },
            (error, result) => {
              if (error) {
                console.error(`[UPLOAD ERROR] Ảnh ${index}:`, error.message);
                return reject(error);
              }
              console.log(`[UPLOAD SUCCESS] Ảnh ${index}:`, result.secure_url);
              resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          stream.end(imgBuffer);
        });
      });

      try {
        const results = await Promise.all(uploadPromises);
        uploadedImages = results.map(r => r.url);
        imagePublicIds = results.map(r => r.publicId);
        console.log("[CREATE] Upload tất cả ảnh thành công");
      } catch (uploadError) {
        console.error("[CREATE] Upload ảnh thất bại:", uploadError.message);
        return { status: "ERR", message: "Lỗi upload ảnh: " + uploadError.message };
      }
    } else {
      console.log("Không có ảnh để upload");
    }

    payload.images = uploadedImages;
    payload.imagePublicIds = imagePublicIds;

    if (payload.short_desc === undefined) {
      payload.short_desc = payload.shortDesc ?? payload.description ?? "";
    }
    if (payload.detail_desc === undefined) {
      payload.detail_desc = payload.detailDesc ?? payload.warrantyDetails ?? "";
    }
    if (typeof payload.status !== "undefined") {
      payload.status = payload.status === true || payload.status === "true";
    }

    console.log("Tạo sản phẩm trong DB...");
    const product = await ProductModel.create(payload);
    console.log("Tạo sản phẩm thành công, _id:", product._id);

    const populatedProduct = await ProductModel.findById(product._id).populate("category", "name status");
    console.log("createProduct SUCCESS");

    return {
      status: "OK",
      message: "Sản phẩm đã được tạo thành công",
      data: populatedProduct,
    };
  } catch (error) {
    console.error("createProduct ERROR:", error.message);
    return { status: "ERR", message: error.message };
  }
};

/**
 * GET PRODUCTS
 */
const getProducts = async (query = {}) => {
  console.log("getProducts START - query:", query);
  try {
    let page = Math.max(1, parseInt(query.page) || 1);
    let limit = Math.min(Math.max(1, parseInt(query.limit) || 5), 100);

    const filter = {};
    const keyword = (query.keyword ?? query.name ?? "").toString().trim();
    if (keyword) filter.name = { $regex: keyword, $options: "i" };
    if (typeof query.status !== "undefined") filter.status = query.status === true || query.status === "true";

    const categoryName = (query.categoryName ?? "").toString().trim();
    if (categoryName) {
      const cat = await CategoryModel.findOne({ name: categoryName, status: true }).select("_id");
      if (!cat) {
        console.log("getProducts: Không tìm thấy categoryName → trả rỗng");
        return {
          status: "OK",
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
        };
      }
      filter.category = cat._id;
    }

    let sortOption = {};
    const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
    const sortOrder = (query.sortOrder ?? "").toString().trim().toLowerCase();
    const validSortFields = ["price", "createdat", "created", "name", "default", "none"];
    const validSortOrders = ["asc", "desc"];

    const isValidSortBy = validSortFields.includes(sortBy);
    const isValidSortOrder = validSortOrders.includes(sortOrder);

    if (sortBy === "default" || sortBy === "none" || !sortBy || !isValidSortBy) {
      sortOption = {};
    } else {
      const order = isValidSortOrder ? (sortOrder === "desc" ? -1 : 1) : 1;
      if (sortBy === "price") sortOption.price = order;
      else if (["createdat", "created"].includes(sortBy)) sortOption.createdAt = order;
      else if (sortBy === "name") sortOption.name = order;
    }

    console.log("getProducts filter:", filter, "sort:", sortOption, "page:", page, "limit:", limit);

    const products = await ProductModel.find(filter)
      .populate("category", "name status")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ProductModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const data = products.map(p => {
      const obj = p.toObject();
      obj.description = obj.short_desc;
      obj.warrantyDetails = obj.detail_desc;
      return obj;
    });

    console.log(`getProducts SUCCESS: ${data.length} sản phẩm`);

    return {
      status: "OK",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("getProducts ERROR:", error.message);
    return { status: "ERR", message: error.message };
  }
};

/**
 * GET PRODUCT BY ID
 */
const getProductById = async (id) => {
  console.log("getProductById START - id:", id);
  try {
    const product = await ProductModel.findById(id).populate("category", "name status");
    if (!product) {
      console.log("getProductById ERR: Không tìm thấy");
      return { status: "ERR", message: "Không tìm thấy sản phẩm" };
    }

    const obj = product.toObject();
    obj.description = obj.short_desc;
    obj.warrantyDetails = obj.detail_desc;
    console.log("getProductById SUCCESS");

    return { status: "OK", data: obj };
  } catch (error) {
    console.error("getProductById ERROR:", error.message);
    return { status: "ERR", message: error.message };
  }
};

/**
 * UPDATE PRODUCT
 */
const updateProduct = async (id, payload) => {
  console.log("updateProduct START - id:", id, "payload:", {
    name: payload.name,
    price: payload.price,
    stockQuantity: payload.quantity ?? payload.stockQuantity,
    category: payload.category,
    imagesCount: payload.images?.length ?? 0,
  });

  try {
    if (payload?.category) {
      let cat = null;
      if (mongoose.isValidObjectId(payload.category)) {
        cat = await CategoryModel.findOne({ _id: payload.category, status: true });
      } else {
        cat = await CategoryModel.findOne({ name: payload.category, status: true });
      }
      if (!cat) {
        console.log("updateProduct ERR: Danh mục không hợp lệ");
        return { status: "ERR", message: "Không tìm thấy danh mục hoặc danh mục đang bị ẩn" };
      }
      payload.category = cat._id;
    }

    let uploadedImages = [];
    let imagePublicIds = [];

    if (payload.images && payload.images.length > 0) {
      console.log(`[UPDATE] Upload ${payload.images.length} ảnh mới...`);

      const uploadPromises = payload.images.map((imgBuffer, index) => {
        return new Promise((resolve, reject) => {
          cloudinary.upload_stream(
            { folder: "products", public_id: `product_update_${id}_${Date.now()}_${index}` },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, publicId: result.public_id });
            }
          ).end(imgBuffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      uploadedImages = results.map(r => r.url);
      imagePublicIds = results.map(r => r.publicId);

      const existing = await ProductModel.findById(id).select("imagePublicIds");
      if (existing?.imagePublicIds?.length > 0) {
        console.log(`[UPDATE] Xóa ${existing.imagePublicIds.length} ảnh cũ...`);
        await Promise.all(existing.imagePublicIds.map(pid => cloudinary.destroy(pid).catch(() => {})));
      }
    }

    payload.images = uploadedImages.length > 0 ? uploadedImages : undefined;
    payload.imagePublicIds = imagePublicIds.length > 0 ? imagePublicIds : undefined;

    if (payload.short_desc === undefined) {
      payload.short_desc = payload.shortDesc ?? payload.description ?? "";
    }
    if (payload.detail_desc === undefined) {
      payload.detail_desc = payload.detailDesc ?? payload.warrantyDetails ?? "";
    }
    if (typeof payload.status !== "undefined") {
      payload.status = payload.status === true || payload.status === "true";
    }

    const updated = await ProductModel.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
      console.log("updateProduct ERR: Không tìm thấy sản phẩm");
      return { status: "ERR", message: "Không tìm thấy sản phẩm" };
    }

    const populatedUpdated = await ProductModel.findById(updated._id).populate("category", "name status");
    console.log("updateProduct SUCCESS");

    return {
      status: "OK",
      message: "Sản phẩm đã được cập nhật thành công",
      data: populatedUpdated,
    };
  } catch (error) {
    console.error("updateProduct ERROR:", error.message);
    return { status: "ERR", message: error.message };
  }
};

/**
 * DELETE PRODUCT
 */
const deleteProduct = async (id) => {
  console.log("deleteProduct START - id:", id);
  try {
    const existing = await ProductModel.findById(id).select("imagePublicIds");
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) {
      console.log("deleteProduct ERR: Không tìm thấy");
      return { status: "ERR", message: "Không tìm thấy sản phẩm" };
    }

    if (existing?.imagePublicIds?.length > 0) {
      console.log(`[DELETE] Xóa ${existing.imagePublicIds.length} ảnh trên Cloudinary...`);
      await Promise.all(existing.imagePublicIds.map(pid => cloudinary.destroy(pid).catch(() => {})));
    }

    console.log("deleteProduct SUCCESS");
    return { status: "OK", message: "Sản phẩm đã được xóa thành công" };
  } catch (error) {
    console.error("deleteProduct ERROR:", error.message);
    return { status: "ERR", message: error.message };
  }
};

/**
 * GET PRODUCT STATS
 */
const getProductStats = async () => {
  console.log("getProductStats START");
  try {
    const [total, visible, hidden] = await Promise.all([
      ProductModel.countDocuments({}),
      ProductModel.countDocuments({ status: true }),
      ProductModel.countDocuments({ status: false }),
    ]);

    console.log("getProductStats SUCCESS:", { total, visible, hidden });
    return { status: "OK", data: { total, visible, hidden } };
  } catch (error) {
    console.error("getProductStats ERROR:", error.message);
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