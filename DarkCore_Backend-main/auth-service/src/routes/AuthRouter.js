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
  updateUserStatusController,
  createStaffController,
  getUsersController,
  getUserDetailsController,
  searchUsersController,
  filterUsersController,
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

// ========================================
// Staff Management (Admin only)
// ========================================
AuthRouter.patch(
  "/users/:userId/status",
  authAdminMiddleware,
  updateUserStatusController
);

AuthRouter.post("/staff", authAdminMiddleware, createStaffController);

AuthRouter.get("/users", authAdminMiddleware, getUsersController);

AuthRouter.get("/users/:id", authAdminMiddleware, getUserDetailsController);

AuthRouter.get("/users/search", authAdminMiddleware, searchUsersController);

AuthRouter.get("/users/filter", authAdminMiddleware, filterUsersController);

module.exports = AuthRouter;
