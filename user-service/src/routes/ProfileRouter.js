const express = require("express");
const routerProfile = express.Router();
const profileController = require("../controller/ProfileController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
    authUserMiddleware,
    attachUserFromHeader
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: API quản lý profile của người dùng
 */
routerProfile.use(attachUserFromHeader);

routerProfile.put(
    "/update-user",
    authUserMiddleware,
    upload.single("avatar"),
    profileController.updateProfile
);

routerProfile.put(
    "/change-password",
    authUserMiddleware,
    profileController.changePassword
);

routerProfile.get("/user-info", authUserMiddleware, profileController.getUserById);

module.exports = routerProfile;