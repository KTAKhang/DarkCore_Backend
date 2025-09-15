const express = require("express");
const AuthController = require("../controller/AuthController");
const AuthRouter = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
    authMiddleware,
    authAdminMiddleware,
    authUserMiddleware,
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API quản lý xác thực người dùng
 */



// 👉 Login bằng Google
AuthRouter.post("/google", AuthController.loginWithGoogle);

AuthRouter.post("/sign-in", AuthController.loginUser);

AuthRouter.post("/register/send-otp", AuthController.sendRegisterOTP);

AuthRouter.post("/register/confirm", AuthController.confirmRegisterOTP);

AuthRouter.post("/forgot-password", AuthController.forgotPassword);

AuthRouter.post("/reset-password", AuthController.resetPassword);



module.exports = AuthRouter;
