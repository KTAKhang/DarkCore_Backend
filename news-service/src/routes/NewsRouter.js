const express = require("express");
const router = express.Router();
const newsController = require("../controller/newsController");
const {
  attachUserFromHeader,
  authUserMiddleware,
  authRoleMiddleware,
} = require("../middleware/newsAuth"); 

// parse x-user header cho tất cả route
router.use(attachUserFromHeader);

// public endpoints
router.get("/", newsController.listNews);
router.get("/:id", newsController.getNewsById);
router.get("/:slug", newsController.getNewsBySlug); // FIXED: Thêm route cho slug (public)

// protected endpoints (admin/editor)
router.post("/", authRoleMiddleware(["admin"]), newsController.createNews);
router.put("/:id", authRoleMiddleware(["admin"]), newsController.updateNews); // FIXED: Đổi /update/:id thành /:id chuẩn REST
router.delete("/:id", authRoleMiddleware(["admin"]), newsController.deleteNews); // FIXED: Đổi /delete/:id thành /:id

module.exports = router;