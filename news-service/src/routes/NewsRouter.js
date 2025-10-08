const express = require("express");
const router = express.Router();
const newsController = require("../controller/NewsController");
const { uploadNewsImage } = require("../middleware/uploadNewsImage");
const {
  attachUserFromHeader,
  authRoleMiddleware,
} = require("../middleware/newsAuth");

// parse x-user header cho tất cả route
router.use(attachUserFromHeader);

// public endpoints
router.get("/", newsController.listNews);
router.get("/:id", newsController.getNewsById);

// protected endpoints (admin/editor)
router.post(
  "/",
  authRoleMiddleware(["admin"]),
  uploadNewsImage, // upload ảnh trước khi tạo news
  newsController.createNews
);

router.put(
  "/:id",
  authRoleMiddleware(["admin"]),
  uploadNewsImage, // upload ảnh trước khi update news
  newsController.updateNews
);

router.delete("/:id", authRoleMiddleware(["admin"]), newsController.deleteNews);

module.exports = router;
