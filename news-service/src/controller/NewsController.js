const newsService = require("../service/NewsService");
const asyncHandler = require("../middleware/asyncHandler");

// Tạo news mới
const createNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized: Missing user auth", status: "ERR" });
  }

  const userName = req.user.name || req.user.user_name || req.user.username || "Admin User";
  req.body.author = req.body.author || { id: req.user._id, name: userName };

  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Missing required fields: title or content", status: "ERR" });
  }

  // req.body.image và req.body.imagePublicId đã được middleware uploadNewsImage thêm vào
  const created = await newsService.createNews(req.body);
  if (!created) {
    return res.status(500).json({ message: "Failed to create news (DB error)", status: "ERR" });
  }
  res.status(201).json(created);
});

// Lấy news theo ID (public: chỉ published)
const getNewsById = asyncHandler(async (req, res) => {
  const news = await newsService.getNewsById(req.params.id);
  if (!news) return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(news);
});

// Cập nhật news theo ID
const updateNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" });
  }

  // req.body.image và req.body.imagePublicId đã được middleware uploadNewsImage thêm vào
  const updated = await newsService.updateNews(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(updated);
});

// Xóa news theo ID (soft delete)
const deleteNews = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized", status: "ERR" });
  }

  const deleted = await newsService.deleteNews(req.params.id);
  if (!deleted) return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json({ message: "News archived successfully" });
});

// Lấy danh sách news với search, filter, sort, pagination (public default published)
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

module.exports = {
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
  listNews,
};
