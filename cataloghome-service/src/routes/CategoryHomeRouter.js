const express = require("express");
const CategoryHomeController = require("../controller/CategoryHomeController");

const router = express.Router();



// Routes cho guest và customer xem categories ở trang home
router.get("/categoryhome", CategoryHomeController.list);
router.get("/categoryhome/featured", CategoryHomeController.featured);
router.get("/categoryhome/:id", CategoryHomeController.detail);

module.exports = router;
