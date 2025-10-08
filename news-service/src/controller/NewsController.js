const newsService = require("../service/NewsService");
const asyncHandler = require("../middleware/asyncHandler");
const News = require("../model/NewsModel"); // ✅ THÊM DÒNG NÀY — import model News

// 📰 Tạo news mới
const createNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing user auth", status: "ERR" });
  }

  const userName =
    req.user.name || req.user.user_name || req.user.username || "Admin User";
  req.body.author = req.body.author || { id: req.user._id, name: userName };

  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({
      message: "Missing required fields: title or content",
      status: "ERR",
    });
  }

  const created = await newsService.createNews(req.body);
  if (!created) {
    return res
      .status(500)
      .json({ message: "Failed to create news (DB error)", status: "ERR" });
  }
  res.status(201).json(created);
});

// 📄 Lấy news theo ID
// Nếu là customer → tăng views (+1)
// Nếu là admin/khác → chỉ fetch
const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let news;

  if (req.user && req.user.role === "customer") {
    // ✅ Atomic increment views (chỉ khi user là customer)
    news = await News.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true, runValidators: true }
    ).populate("author.id", "name email");

    if (!news) {
      return res.status(404).json({ message: "News not found", status: "ERR" });
    }

    // Giới hạn thông tin trả về cho customer (chỉ những field cần thiết)
    const safeNews = {
      _id: news._id,
      title: news.title,
      content: news.content,
      image: news.image,
      createdAt: news.createdAt,
      views: news.views,
      author: news.author?.name || "Ẩn danh",
    };
    return res.json(safeNews);
  } else {
    // ✅ Không phải customer → dùng service để lấy đầy đủ
    news = await newsService.getNewsById(id);
    if (!news)
      return res.status(404).json({ message: "News not found", status: "ERR" });
    return res.json(news);
  }
});

// ✏️ Cập nhật news
const updateNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" });
  }

  const updated = await newsService.updateNews(req.params.id, req.body);
  if (!updated)
    return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(updated);
});

// 🗑️ Xóa news (soft delete)
const deleteNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" });
  }

  const deleted = await newsService.deleteNews(req.params.id);
  if (!deleted)
    return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json({ message: "News archived successfully" });
});

// 📋 Lấy danh sách news (public → chỉ published)
const listNews = asyncHandler(async (req, res) => {
  const options = {
    q: req.query.q,
    author: req.query.author,
    tags: req.query.tags,
    status: req.query.status || (req.user ? undefined : "published"),
    sortBy: req.query.sortBy || "publishedAt",
    order: req.query.order || "desc",
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };

  const result = await newsService.listNews(options);
  res.json(result);
});

// 📊 Lấy thống kê news (admin)
const getStats = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" });
  }

  const stats = await newsService.getStats();
  res.json(stats);
});

module.exports = {
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
  listNews,
  getStats,
};
