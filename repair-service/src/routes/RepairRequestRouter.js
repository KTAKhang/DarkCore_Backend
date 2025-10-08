const express = require("express");
const RepairRequestController = require("../controllers/RepairRequestController");
const { requireAuth, requireAdmin, requireTechnicianOrAdmin } = require("../utils/auth");

const router = express.Router();

// Customer
router.post("/repairs", requireAuth, RepairRequestController.create);
router.put("/repairs/:id", requireAuth, RepairRequestController.update);
router.delete("/repairs/:id", requireAuth, RepairRequestController.cancel);
router.get("/repairs/me", requireAuth, RepairRequestController.listMine);

// Admin
router.get("/repairs", requireAdmin, RepairRequestController.listAll);
router.get("/repairs/:id", requireTechnicianOrAdmin, RepairRequestController.detail);
router.patch("/repairs/:id/assign", requireAdmin, RepairRequestController.assign);
router.patch("/repairs/:id/status", requireTechnicianOrAdmin, RepairRequestController.updateStatus);

// Repair-staff
router.get("/repairs/assigned/me", requireTechnicianOrAdmin, RepairRequestController.listAssigned);

module.exports = router;


