const UserModel = require("../models/UserModel");
const AuthService = require("../services/AuthService");


const loginWithGoogle = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                status: "ERR",
                message: "Google ID token is required",
            });
        }
        const response = await AuthService.loginWithGoogle(idToken);
        const cookieValue = response.token.refresh_token;
        res.cookie("refreshToken", cookieValue, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        if (response.status === "ERR") {
            return res.status(400).json(response);
        }

        return res.status(200).json({
            status: "OK",
            message: "Login success",
            data: response.data,
            token: {
                access_token: response.token.access_token, // chỉ trả access_token
            },
        });
    } catch (error) {
        return res.status(500).json({
            status: "ERR",
            message: error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ status: "ERR", message: "All fields are required" });
        }
        const isStrictEmail = (email) => {
            const strictRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return strictRegex.test(email);
        };
        if (!isStrictEmail(email)) {
            return res.status(200).json({ status: "ERR", message: "Invalid email " });
        }
        const response = await AuthService.loginUser(req.body);
        const cookieValue = response.token.refresh_token;

        res.cookie("refreshToken", cookieValue, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            status: "OK",
            message: "Login success",
            data: response.data,
            token: {
                access_token: response.token.access_token,
            },
        });
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

// Refresh token
const refreshTokenController = async (req, res) => {
    try {

        const refreshToken = req.cookies.refreshToken;


        if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

        const newToken = await AuthService.refreshAccessToken(refreshToken);
        return res.status(200).json({ status: "OK", token: newToken });
    } catch (error) {
        return res.status(401).json({ status: "ERR", message: error.message });
    }

};


const logoutController = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        });

        if (!refreshToken) {
            return res.status(200).json({ status: "OK", message: "No user logged in" });
        }

        // Tìm user theo refresh token
        const user = await UserModel.findOne({ refreshToken });
        if (user) {
            // Xoá refresh token trong DB
            await AuthService.logoutUser(user._id);
        }

        return res.status(200).json({ status: "OK", message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const sendRegisterOTP = async (req, res) => {
    try {

        const { user_name, email, password, phone, address } = req.body;


        if (!user_name || !email || !password || !phone || !address) {
            return res.status(400).json({
                status: "ERR",
                message: "Missing required fields",
            });
        }

        const isStrictPassword = (password) => {
            const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
            return regex.test(password);
        };

        if (!isStrictPassword(password)) {
            return res.status(400).json({
                status: "ERR",
                message:
                    "Password must contain at least 8 characters, including uppercase and number",
            });
        }

        const response = await AuthService.sendRegisterOTP(user_name, email, password, phone, address);

        if (response.status === "ERR") {
            return res.status(400).json(response);
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: "ERR",
            message: error.message,
        });
    }
};

const confirmRegisterOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                status: "ERR",
                message: "OTP is required",
            });
        }

        const response = await AuthService.confirmRegisterOTP(otp);

        if (response.status === "ERR") {
            return res.status(400).json(response);
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: "ERR",
            message: error.message,
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "ERR",
                message: "Email is required",
            });
        }

        const response = await AuthService.sendResetPasswordOTP(email);

        if (!response || response.status === "ERR") {
            return res.status(400).json(response || {
                status: "ERR",
                message: "Không thể gửi OTP",
            });
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            status: "ERR",
            message: error.message,
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                status: "ERR",
                message: "Email, OTP, and new password are required",
            });
        }

        const isStrictPassword = (password) => {
            const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
            return regex.test(password);
        };

        if (!isStrictPassword(newPassword)) {
            return res.status(400).json({
                status: "ERR",
                message:
                    "Password must contain at least 8 characters, including uppercase and number",
            });
        }

        const response = await AuthService.resetPassword(email, otp, newPassword);

        if (response.status === "ERR") {
            return res.status(400).json(response);
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            status: "ERR",
            message: error.message,
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword,
    sendRegisterOTP,
    confirmRegisterOTP,
    loginWithGoogle,
    loginUser,
    refreshTokenController,
    logoutController
};
