const express = require("express");
const AuthRouter = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  authMiddleware,
  authAdminMiddleware,
  authUserMiddleware,
} = require("../middleware/authMiddleware");

const {
  forgotPassword,
  resetPassword,
  sendRegisterOTP,
  confirmRegisterOTP,
  loginWithGoogle,
  loginUser,
} = require("../controller/AuthController");

// ========================================
// Authentication (Login, Register, Forgot Password)
// ========================================
AuthRouter.post("/google", loginWithGoogle);
AuthRouter.post("/sign-in", loginUser);
AuthRouter.post("/register/send-otp", sendRegisterOTP);
AuthRouter.post("/register/confirm", confirmRegisterOTP);
AuthRouter.post("/forgot-password", forgotPassword);
AuthRouter.post("/reset-password", resetPassword);

module.exports = AuthRouter;
