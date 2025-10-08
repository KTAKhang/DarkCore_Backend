const express = require("express");
const RepairServiceController = require("../controllers/RepairServiceController");
const { requireAuth, requireAdminOrRepairStaff } = require("../utils/auth");

const router = express.Router();

router.post("/services", requireAdminOrRepairStaff, RepairServiceController.create);
router.get("/services", requireAuth, RepairServiceController.list);
router.put("/services/:id", requireAdminOrRepairStaff, RepairServiceController.update);
router.delete("/services/:id", requireAdminOrRepairStaff, RepairServiceController.remove);

module.exports = router;


