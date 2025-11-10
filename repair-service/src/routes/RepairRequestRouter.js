const express = require("express");
const RepairRequestController = require("../controllers/RepairRequestController");
const { attachUserFromHeader, authUserMiddleware, authAdminMiddleware, authAdminOrRepairStaffMiddleware } = require("../utils/auth");

const router = express.Router();

// Customer
router.post("/repairs", attachUserFromHeader, authUserMiddleware, RepairRequestController.create);
router.put("/repairs/:id", attachUserFromHeader, authUserMiddleware, RepairRequestController.update);
router.delete("/repairs/:id", attachUserFromHeader, authUserMiddleware, RepairRequestController.cancel);
router.get("/repairs/me", attachUserFromHeader, authUserMiddleware, RepairRequestController.listMine);

// Admin
router.get("/repairs", attachUserFromHeader, authAdminMiddleware, RepairRequestController.listAll);
router.get("/repairs/:id", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairRequestController.detail);
router.patch("/repairs/:id/assign", attachUserFromHeader, authAdminMiddleware, RepairRequestController.assign);
router.patch("/repairs/:id/status", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairRequestController.updateStatus);

// Repair-staff
router.get("/repairs/assigned/me", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairRequestController.listAssigned);

module.exports = router;


