const newsService = require("../service/NewsService");
const asyncHandler = require("../middleware/asyncHandler");

// Tạo news mới
const createNews = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: Missing user auth", status: "ERR" });
    }

    const userName = req.user.name || req.user.user_name || req.user.username || "Admin User";
    req.body.author = req.body.author || { id: req.user._id, name: userName };

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Missing required fields: title or content", status: "ERR" });
    }

    console.log("CreateNews req.body.author:", req.body.author);

    const created = await newsService.createNews(req.body);
    if (!created) {
      return res.status(500).json({ message: "Failed to create news (DB error)", status: "ERR" });
    }
    res.status(201).json(created);
  } catch (err) {
    console.error("CreateNews error:", err);
    res.status(500).json({ message: err.message || "Internal server error", status: "ERR" });
  }
});

// Lấy news theo ID (public: chỉ published)
const getNewsById = asyncHandler(async (req, res) => {
  const news = await newsService.getNewsById(req.params.id);
  if (!news) return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(news);
});

// Lấy news theo slug (public: chỉ published)
const getNewsBySlug = asyncHandler(async (req, res) => {
  const news = await newsService.getNewsBySlug(req.params.slug);
  if (!news) return res.status(404).json({ message: "News not found", status: "ERR" });
  res.json(news);
});

// Cập nhật news theo ID
const updateNews = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized", status: "ERR" });
    }

    const updated = await newsService.updateNews(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "News not found", status: "ERR" });
    res.json(updated);
  } catch (err) {
    console.error("UpdateNews error:", err);
    res.status(500).json({ message: err.message || "Update failed", status: "ERR" });
  }
});

// Xóa news theo ID (soft delete)
const deleteNews = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized", status: "ERR" });
    }

    const deleted = await newsService.deleteNews(req.params.id);
    if (!deleted) return res.status(404).json({ message: "News not found", status: "ERR" });
    res.json({ message: "News archived successfully" });
  } catch (err) {
    console.error("DeleteNews error:", err);
    res.status(500).json({ message: err.message || "Delete failed", status: "ERR" });
  }
});

// Lấy danh sách news với search, filter, sort, pagination (public default published)
const listNews = asyncHandler(async (req, res) => {
  try {
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

    console.log("ListNews options:", options);
    console.log("req.user in listNews:", req.user);

    const result = await newsService.listNews(options);
    console.log("ListNews result total:", result.total); // FIXED: Log result để debug
    res.json(result);
  } catch (err) {
    console.error("ListNews error:", err);
    res.status(500).json({ message: err.message || "List failed", status: "ERR" });
  }
});

module.exports = {
  createNews,
  getNewsById,
  getNewsBySlug,
  updateNews,
  deleteNews,
  listNews,
};