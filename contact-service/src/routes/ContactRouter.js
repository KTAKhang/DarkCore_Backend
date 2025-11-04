const express = require("express");
const router = express.Router();

const contactController = require("../controller/ContactController");
const { uploadContactAttachments } = require("../middleware/uploadContactAttachments");
const { uploadContactImage } = require("../middleware/uploadContactImage");
const {
  attachUserFromHeader,
  authRoleMiddleware,
  checkOwnership,
} = require("../middleware/contactAuth");

router.use(attachUserFromHeader);

// ==================== ⚠️ STATIC ROUTES FIRST ====================
// Các route có tên cố định phải đặt TRƯỚC /:id

// GET /api/contacts/stats - Thống kê (admin only)
router.get(
  "/stats",
  authRoleMiddleware(["admin"]),
  contactController.getContactStats
);

// GET /api/contacts - List/search/filter với query params
router.get("/", contactController.listContacts); // ⚠️ Bỏ validateListQuery

// ==================== DYNAMIC ROUTES (/:id) ====================

// GET /api/contacts/:id - Chi tiết ticket
router.get("/:id", checkOwnership, contactController.getContactById); // ⚠️ Bỏ validateContactId

// POST /api/contacts - Tạo ticket mới
router.post(
  "/",
  authRoleMiddleware(["customer", "admin"]),
  uploadContactImage,
  uploadContactAttachments,
  // ⚠️ Bỏ validateContact để dễ test dữ liệu ảo
  contactController.createContact
);

// PUT /api/contacts/:id - Admin cập nhật status + thêm/cập nhật reply cùng lúc
router.put(
  "/:id",
  authRoleMiddleware(["admin"]),
  uploadContactAttachments,
  contactController.updateContact // ⚠️ xử lý status + reply trong controller
);

// DELETE /api/contacts/:id - Soft delete
router.delete(
  "/:id",
  authRoleMiddleware(["admin"]),
  contactController.deleteContact // ⚠️ Bỏ validateContactId
);

module.exports = router;
