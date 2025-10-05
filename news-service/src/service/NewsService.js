const News = require("../model/NewsModel");
const mongoose = require("mongoose");
const User = require("../model/UserModel"); // FIXED: Import User model trước populate

// Tạo news mới
const createNews = async (data) => {
  try {
    if (!data.author || !data.author.id || !data.author.name) {
      throw new Error("Author required: {id, name}");
    }

    // FIXED: Cast author.id to ObjectId nếu string
    if (typeof data.author.id === 'string') {
      data.author.id = new mongoose.Types.ObjectId(data.author.id);
    }

    const news = new News(data);
    const saved = await news.save();
    console.log("Service createNews saved:", saved._id);
    return saved;
  } catch (err) {
    console.error("CreateNews service error:", err);
    if (err.code === 11000) {
      throw new Error("Slug already exists – change title");
    }
    throw err;
  }
};

// Lấy news theo ID (public: chỉ published)
const getNewsById = async (id) => {
  try {
    return await News.findOne({ _id: id, status: "published" })
      .populate("author.id", "name email");
  } catch (err) {
    console.error("GetById service error:", err);
    throw err;
  }
};

// Lấy news theo slug (public: chỉ published)
const getNewsBySlug = async (slug) => {
  try {
    return await News.findOne({ slug, status: "published" })
      .populate("author.id", "name email");
  } catch (err) {
    console.error("GetBySlug service error:", err);
    throw err;
  }
};

// Cập nhật news theo ID
const updateNews = async (id, data) => {
  try {
    if (data.author && data.author.id && typeof data.author.id === 'string') {
      data.author.id = new mongoose.Types.ObjectId(data.author.id);
    }

    return await News.findByIdAndUpdate(
      id, 
      data, 
      { 
        new: true, 
        runValidators: true 
      }
    ).populate("author.id", "name email");
  } catch (err) {
    console.error("UpdateNews service error:", err);
    throw err;
  }
};

// Xóa news theo ID (soft delete)
const deleteNews = async (id) => {
  try {
    return await News.findByIdAndUpdate(
      id,
      { 
        status: "archived",
        deletedAt: new Date() 
      },
      { new: true }
    );
  } catch (err) {
    console.error("DeleteNews service error:", err);
    throw err;
  }
};

// Lấy danh sách news với filter/search/sort/pagination
const listNews = async ({
  q,
  author,
  tags,
  status,
  sortBy = "publishedAt",
  order = "desc",
  page = 1,
  limit = 10,
}) => {
  try {
    const filter = { ...(status && { status }) };

    if (q) filter.$text = { $search: q };
    if (author) filter["author.name"] = new RegExp(author, "i");
    if (tags) filter.tags = { $in: tags.split(",").map(t => t.trim()) };

    console.log("Service filter:", filter);

    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    let data = await News.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // FIXED: Wrap populate in try-catch
    try {
      data = await News.populate(data, { path: "author.id", select: "name email", model: User });
    } catch (populateErr) {
      console.error("Populate author error:", populateErr);
      // Fallback: Raw data, không populate (author.id vẫn là ObjectId string)
    }

    const total = await News.countDocuments(filter);

    console.log("Service total count:", total);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error("ListNews service error:", err);
    throw err;
  }
};

module.exports = {
  createNews,
  getNewsById,
  getNewsBySlug,
  updateNews,
  deleteNews,
  listNews,
};