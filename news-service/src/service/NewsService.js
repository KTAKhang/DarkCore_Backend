const News = require("../model/NewsModel");
const mongoose = require("mongoose");
const User = require("../model/UserModel");
const cloudinary = require("../config/cloudinaryConfig");

// Tạo news mới
const createNews = async (data) => {
  try {
    // FIX: Handle tags string → array
    if (data.tags && typeof data.tags === "string") {
      data.tags = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    if (!data.author || !data.author.id || !data.author.name) {
      throw new Error("Author required: {id, name}");
    }

    if (typeof data.author.id === "string") {
      data.author.id = new mongoose.Types.ObjectId(data.author.id);
    }

    const news = new News(data);
    const saved = await news.save();
    return saved;
  } catch (err) {
    console.error("CreateNews service error:", err);
    throw err;
  }
};

// Lấy news theo ID (public: chỉ published) - SỬA: Không increment ở service nữa, di chuyển logic lên controller
const getNewsById = async (id) => {
  try {
    // THÊM: Chỉ fetch published news (giữ nguyên logic public)
    return await News.findOne({ _id: id, status: "published" }).populate(
      "author.id",
      "name email"
    );
  } catch (err) {
    console.error("GetById service error:", err);
    throw err;
  }
};

// Cập nhật news theo ID
const updateNews = async (id, payload) => {
  try {
    // FIX: Handle tags string → array
    if (payload.tags && typeof payload.tags === "string") {
      payload.tags = payload.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    if (
      payload.author &&
      payload.author.id &&
      typeof payload.author.id === "string"
    ) {
      payload.author.id = new mongoose.Types.ObjectId(payload.author.id);
    }

    // Nếu có ảnh mới, xóa ảnh cũ trên Cloudinary
    if (payload.image) {
      const existing = await News.findById(id).select("imagePublicId");
      if (existing && existing.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existing.imagePublicId);
        } catch (e) {
          console.warn("Failed to delete old news image:", e.message);
        }
      }
    }

    const updated = await News.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("author.id", "name email");

    if (!updated) throw new Error("News not found");
    return updated;
  } catch (err) {
    console.error("UpdateNews service error:", err);
    throw err;
  }
};

// Xóa news theo ID (soft delete)
const deleteNews = async (id) => {
  try {
    const deleted = await News.findByIdAndUpdate(
      id,
      {
        status: "archived",
        deletedAt: new Date(),
      },
      { new: true }
    );
    if (!deleted) throw new Error("News not found");
    return deleted;
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
    if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) };

    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    let data = await News.find(filter).sort(sort).skip(skip).limit(limit);

    try {
      data = await News.populate(data, {
        path: "author.id",
        select: "name email",
        model: User,
      });
    } catch (populateErr) {
      console.warn("Populate author failed:", populateErr.message);
    }

    const total = await News.countDocuments(filter);

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

// THÊM: Lấy thống kê tổng (count theo status, không filter)
const getStats = async () => {
  try {
    const aggregationResult = await News.aggregate([
      // Group theo status và count
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      // Group lại để tính total và sum có điều kiện cho từng status
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          published: {
            $sum: { $cond: [{ $eq: ["$_id", "published"] }, "$count", 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$_id", "draft"] }, "$count", 0] },
          },
          archived: {
            $sum: { $cond: [{ $eq: ["$_id", "archived"] }, "$count", 0] },
          },
        },
      },
      // Project chỉ fields cần
      {
        $project: {
          _id: 0,
          total: 1,
          published: 1,
          draft: 1,
          archived: 1,
        },
      },
    ]);

    // Fallback nếu không có data
    return (
      aggregationResult[0] || { total: 0, published: 0, draft: 0, archived: 0 }
    );
  } catch (err) {
    console.error("GetStats service error:", err);
    throw new Error("Không thể tải thống kê news");
  }
};

module.exports = {
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
  listNews,
  getStats, // THÊM: Export method mới
};
