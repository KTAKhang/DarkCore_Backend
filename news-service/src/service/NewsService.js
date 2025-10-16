const News = require("../model/NewsModel"); 
const mongoose = require("mongoose");
const User = require("../model/UserModel"); 
const cloudinary = require("../config/cloudinaryConfig"); 

// Tạo tin tức mới
const createNews = async (data) => {
  try {
    // Xử lý tags: chuyển từ chuỗi sang mảng nếu là chuỗi
    if (data.tags && typeof data.tags === "string") {
      data.tags = data.tags
        .split(",") // Tách chuỗi tags bằng dấu phẩy
        .map((tag) => tag.trim()) // Loại bỏ khoảng trắng
        .filter(Boolean); // Lọc bỏ các giá trị rỗng
    }

    // Kiểm tra thông tin tác giả bắt buộc
    if (!data.author || !data.author.id || !data.author.name) {
      throw new Error("Author required: {id, name}"); // Ném lỗi nếu thiếu thông tin tác giả
    }

    // Kiểm tra trùng tiêu đề
    const existing = await News.findOne({ title: data.title.trim() });
    if (existing) {
      const err = new Error("Tiêu đề tin tức đã tồn tại!");
      err.statusCode = 400; // Gán mã lỗi 400
      throw err;
    }

    // Chuyển đổi author.id thành ObjectId nếu là chuỗi
    if (typeof data.author.id === "string") {
      data.author.id = new mongoose.Types.ObjectId(data.author.id);
    }

    // Tạo instance News mới và lưu vào DB
    const news = new News(data);
    const saved = await news.save();
    return saved; // Trả về tin tức đã lưu
  } catch (err) {
    // Xử lý lỗi trùng key (Mongo duplicate key error)
    if (err.code === 11000) {
      err.message = "Tiêu đề tin tức đã tồn tại!";
      err.statusCode = 400;
    }
    console.error("CreateNews service error:", err); // Ghi log lỗi
    throw err; // Ném lỗi để xử lý ở tầng trên
  }
};

// Lấy tin tức theo ID (chỉ lấy tin published)
const getNewsById = async (id) => {
  try {
    // Tìm tin tức theo ID và trạng thái published, populate thông tin tác giả
    return await News.findOne({ _id: id, status: "published" }).populate(
      "author.id",
      "name email"
    ); // Chỉ lấy name và email của tác giả
  } catch (err) {
    console.error("GetById service error:", err); // Ghi log lỗi
    throw err; // Ném lỗi để xử lý ở tầng trên
  }
};

// Cập nhật tin tức theo ID
const updateNews = async (id, payload) => {
  try {
    // Xử lý tags: chuyển từ chuỗi sang mảng nếu là chuỗi
    if (payload.tags && typeof payload.tags === "string") {
      payload.tags = payload.tags
        .split(",") // Tách chuỗi tags bằng dấu phẩy
        .map((tag) => tag.trim()) // Loại bỏ khoảng trắng
        .filter(Boolean); // Lọc bỏ các giá trị rỗng
    }

    // Chuyển đổi author.id thành ObjectId nếu là chuỗi
    if (
      payload.author &&
      payload.author.id &&
      typeof payload.author.id === "string"
    ) {
      payload.author.id = new mongoose.Types.ObjectId(payload.author.id);
    }

    // Nếu có ảnh mới, xóa ảnh cũ trên Cloudinary
    if (payload.image) {
      const existing = await News.findById(id).select("imagePublicId"); // Lấy imagePublicId của tin tức
      if (existing && existing.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existing.imagePublicId); // Xóa ảnh cũ trên Cloudinary
        } catch (e) {
          console.warn("Failed to delete old news image:", e.message); // Ghi log cảnh báo nếu xóa ảnh thất bại
        }
      }
    }

    // Cập nhật tin tức theo ID với dữ liệu mới
    const updated = await News.findByIdAndUpdate(id, payload, {
      new: true, // Trả về bản ghi đã cập nhật
      runValidators: true, // Chạy các validator của schema
    }).populate("author.id", "name email"); // Populate thông tin tác giả

    // Kiểm tra nếu không tìm thấy tin tức
    if (!updated) throw new Error("News not found");
    return updated; // Trả về tin tức đã cập nhật
  } catch (err) {
    console.error("UpdateNews service error:", err); // Ghi log lỗi
    throw err; // Ném lỗi để xử lý ở tầng trên
  }
};

// Xóa tin tức theo ID (soft delete)
const deleteNews = async (id) => {
  try {
    // Soft delete: cập nhật trạng thái thành archived và thêm deletedAt
    const deleted = await News.findByIdAndUpdate(
      id,
      {
        status: "archived",
        deletedAt: new Date(),
      },
      { new: true } // Trả về bản ghi đã cập nhật
    );
    // Kiểm tra nếu không tìm thấy tin tức
    if (!deleted) throw new Error("News not found");
    return deleted; // Trả về tin tức đã xóa (archived)
  } catch (err) {
    console.error("DeleteNews service error:", err); // Ghi log lỗi
    throw err; // Ném lỗi để xử lý ở tầng trên
  }
};

// Lấy danh sách tin tức với filter, search, sort, và pagination
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
    // Tạo object filter dựa trên các tham số
    const filter = { ...(status && { status }) }; // Lọc theo trạng thái nếu có
    if (q) filter.$text = { $search: q }; // Tìm kiếm full-text nếu có query
    if (author) filter["author.name"] = new RegExp(author, "i"); // Lọc theo tên tác giả (không phân biệt hoa thường)
    if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) }; // Lọc theo danh sách tags

    // Tạo object sort
    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1; // Sắp xếp theo sortBy và order (asc/desc)

    // Tính số lượng bản ghi cần bỏ qua (skip) cho pagination
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    // Tìm danh sách tin tức theo filter, sort, skip, và limit
    let data = await News.find(filter).sort(sort).skip(skip).limit(limit);

    // Populate thông tin tác giả
    try {
      data = await News.populate(data, {
        path: "author.id",
        select: "name email",
        model: User,
      }); // Populate name và email của tác giả
    } catch (populateErr) {
      console.warn("Populate author failed:", populateErr.message); // Ghi log cảnh báo nếu populate thất bại
    }

    // Đếm tổng số bản ghi thỏa mãn filter
    const total = await News.countDocuments(filter);

    // Trả về kết quả với dữ liệu, tổng số bản ghi, trang hiện tại, và số trang
    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error("ListNews service error:", err); // Ghi log lỗi
    throw err; // Ném lỗi để xử lý ở tầng trên
  }
};

// Lấy thống kê tin tức (theo status)
const getStats = async () => {
  try {
    // Sử dụng aggregation để tính thống kê
    const aggregationResult = await News.aggregate([
      // Group theo status và đếm số lượng
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      // Group lại để tính tổng và các trạng thái cụ thể
      {
        $group: {
          _id: null,
          total: { $sum: "$count" }, // Tổng số tin tức
          published: {
            $sum: { $cond: [{ $eq: ["$_id", "published"] }, "$count", 0] }, // Đếm tin published
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$_id", "draft"] }, "$count", 0] }, // Đếm tin draft
          },
          archived: {
            $sum: { $cond: [{ $eq: ["$_id", "archived"] }, "$count", 0] }, // Đếm tin archived
          },
        },
      },
      // Chỉ lấy các trường cần thiết
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

    // Trả về kết quả, fallback nếu không có dữ liệu
    return (
      aggregationResult[0] || { total: 0, published: 0, draft: 0, archived: 0 }
    );
  } catch (err) {
    console.error("GetStats service error:", err); // Ghi log lỗi
    throw new Error("Không thể tải thống kê news"); // Ném lỗi với thông điệp tùy chỉnh
  }
};

// Xuất các hàm service để sử dụng ở tầng controller
module.exports = {
  createNews, 
  getNewsById, 
  updateNews, 
  deleteNews, 
  listNews, 
  getStats, 
};