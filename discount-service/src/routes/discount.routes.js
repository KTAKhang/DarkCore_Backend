const express = require("express");
const router = express.Router();

// Reuse auth middleware via local re-export wrapper
const { authAdminMiddleware, authUserMiddleware } = require("../middlewares/authMiddleware");

const {
    createDiscount,
    getAllDiscounts,
    getAllDiscountsLegacy,
    getActiveDiscounts,
    getByCode,
    updateDiscount,
    deactivateDiscount,
    applyDiscount,
    searchDiscounts
} = require("../controllers/discount.controller");

// POST /discounts - Admin create
router.post("/discounts", authUserMiddleware, authAdminMiddleware, createDiscount);

// GET /discounts - Admin list all (với phân trang, sort, filter)
router.get("/discounts", authUserMiddleware, authAdminMiddleware, getAllDiscounts);

// GET /discounts/legacy - Admin list all (method cũ)
router.get("/discounts/legacy", authUserMiddleware, authAdminMiddleware, getAllDiscountsLegacy);

// GET /discounts/search - Admin search discounts
router.get("/discounts/search", authUserMiddleware, authAdminMiddleware, searchDiscounts);

// GET /discounts/active - Public via gateway auth (any logged-in user)
router.get("/discounts/active", authUserMiddleware, getActiveDiscounts);

// GET /discounts/:code - Admin, user (admin sees all; user sees only active)
router.get("/discounts/:code", authUserMiddleware, getByCode);

// PATCH /discounts/:id - Admin update or deactivate
router.patch("/discounts/:id", authUserMiddleware, authAdminMiddleware, updateDiscount);

// DELETE /discounts/:id - Admin soft deactivate (isActive=false)
router.delete("/discounts/:id", authUserMiddleware, authAdminMiddleware, deactivateDiscount);

// POST /discounts/apply - User/Admin apply discount to order
router.post("/discounts/apply", authUserMiddleware, applyDiscount);

module.exports = router;


