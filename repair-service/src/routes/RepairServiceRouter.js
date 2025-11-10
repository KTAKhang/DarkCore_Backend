const express = require("express");
const RepairServiceController = require("../controllers/RepairServiceController");
const { attachUserFromHeader, authUserMiddleware, authAdminOrRepairStaffMiddleware } = require("../utils/auth");

const router = express.Router();

router.post("/services", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairServiceController.create);
router.get("/services", attachUserFromHeader, authUserMiddleware, RepairServiceController.list);
router.put("/services/:id", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairServiceController.update);
router.delete("/services/:id", attachUserFromHeader, authAdminOrRepairStaffMiddleware, RepairServiceController.remove);

module.exports = router;


