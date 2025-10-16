const newsService = require("../service/NewsService"); 
const asyncHandler = require("../middleware/asyncHandler"); 
const News = require("../model/NewsModel");

// Tạo tin tức mới
const createNews = async (req, res) => {
  try {
    // Kiểm tra xác thực người dùng
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Unauthorized: Missing user auth",
        status: "ERR",
      }); // Trả lỗi 401 nếu thiếu thông tin người dùng
    }

    // Lấy tên tác giả từ req.user, mặc định là "Admin User" nếu không có
    const userName =
      req.user.name || req.user.user_name || req.user.username || "Admin User";
    // Gán thông tin tác giả vào req.body nếu chưa có
    req.body.author = req.body.author || { id: req.user._id, name: userName };

    // Lấy title và content từ body
    const { title, content } = req.body;
    // Kiểm tra các trường bắt buộc
    if (!title || !content) {
      return res.status(400).json({
        message: "Missing required fields: title or content",
        status: "ERR",
      }); // Trả lỗi 400 nếu thiếu title hoặc content
    }

    // Gọi NewsService để tạo tin tức
    const created = await newsService.createNews(req.body);
    // Trả về phản hồi với mã 201 và dữ liệu tin tức đã tạo
    res.status(201).json(created);
  } catch (err) {
    // Ghi log lỗi để debug
    console.error("CreateNews controller error:", err);
    // Trả lỗi với mã trạng thái từ lỗi hoặc mặc định 500
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Lỗi khi tạo tin tức", status: "ERR" });
  }
};

// Lấy tin tức theo ID
// Nếu là customer → tăng views (+1), nếu là admin/khác → chỉ fetch
const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params; // Lấy ID tin tức từ params
  let news;

  // Kiểm tra nếu người dùng là customer
  if (req.user && req.user.role === "customer") {
    // Tăng views (+1) cho tin tức bằng cách sử dụng atomic update
    news = await News.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // Tăng trường views lên 1
      { new: true, runValidators: true } // Trả về bản ghi mới và chạy validator
    ).populate("author.id", "name email"); // Populate thông tin tác giả (name, email)

    // Kiểm tra nếu không tìm thấy tin tức
    if (!news) {
      return res.status(404).json({ message: "News not found", status: "ERR" });
    }

    // Giới hạn thông tin trả về cho customer
    const safeNews = {
      _id: news._id,
      title: news.title,
      content: news.content,
      image: news.image,
      createdAt: news.createdAt,
      views: news.views,
      author: news.author?.name || "Ẩn danh", // Lấy tên tác giả hoặc mặc định "Ẩn danh"
    };
    return res.json(safeNews); // Trả về phản hồi với dữ liệu an toàn
  } else {
    // Nếu không phải customer, gọi NewsService để lấy đầy đủ thông tin
    news = await newsService.getNewsById(id);
    // Kiểm tra nếu không tìm thấy tin tức
    if (!news)
      return res.status(404).json({ message: "News not found", status: "ERR" });
    return res.json(news); // Trả về toàn bộ thông tin tin tức
  }
});

// Cập nhật tin tức
const updateNews = asyncHandler(async (req, res) => {
  // Kiểm tra xác thực người dùng
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" }); // Trả lỗi 401 nếu thiếu thông tin người dùng
  }

  // Gọi NewsService để cập nhật tin tức theo ID và dữ liệu từ body
  const updated = await newsService.updateNews(req.params.id, req.body);
  // Kiểm tra nếu không tìm thấy tin tức
  if (!updated)
    return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(updated); // Trả về phản hồi với dữ liệu đã cập nhật
});

// Xóa tin tức (soft delete)
const deleteNews = asyncHandler(async (req, res) => {
  // Kiểm tra xác thực người dùng
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" }); // Trả lỗi 401 nếu thiếu thông tin người dùng
  }

  // Gọi NewsService để thực hiện soft delete tin tức
  const deleted = await newsService.deleteNews(req.params.id);
  // Kiểm tra nếu không tìm thấy tin tức
  if (!deleted)
    return res.status(404).json({ message: "News not found", status: "ERR" });
  // Trả về phản hồi xác nhận xóa thành công
  res.json({ message: "News archived successfully" });
});

// Lấy danh sách tin tức (public chỉ lấy tin đã published)
const listNews = asyncHandler(async (req, res) => {
  // Tạo object options từ các query params
  const options = {
    q: req.query.q, // Tìm kiếm theo từ khóa
    author: req.query.author, // Lọc theo tác giả
    tags: req.query.tags, // Lọc theo tags
    status: req.query.status || (req.user ? undefined : "published"), // Chỉ lấy tin published nếu không có user
    sortBy: req.query.sortBy || "publishedAt", // Sắp xếp theo trường, mặc định là publishedAt
    order: req.query.order || "desc", // Thứ tự sắp xếp, mặc định giảm dần
    page: parseInt(req.query.page) || 1, // Trang hiện tại, mặc định là 1
    limit: parseInt(req.query.limit) || 10, // Số lượng bản ghi mỗi trang, mặc định là 10
  };

  // Gọi NewsService để lấy danh sách tin tức theo options
  const result = await newsService.listNews(options);
  res.json(result); // Trả về phản hồi với danh sách tin tức
});

// Lấy thống kê tin tức (dành cho admin)
const getStats = asyncHandler(async (req, res) => {
  // Kiểm tra xác thực người dùng
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" }); // Trả lỗi 401 nếu thiếu thông tin người dùng
  }

  // Gọi NewsService để lấy thống kê
  const stats = await newsService.getStats();
  res.json(stats); // Trả về phản hồi với dữ liệu thống kê
});

// Xuất các controller để sử dụng trong router
module.exports = {
  createNews, 
  getNewsById, 
  updateNews, 
  deleteNews, 
  listNews, 
  getStats, 
};