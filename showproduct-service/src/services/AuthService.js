const UserModel = require("../models/UserModel");
const TempOTPModel = require("../models/TempOTPModel");
const RoleModel = require("../models/RolesModel");
const nodemailer = require("nodemailer");
const { GoogleAuth } = require("google-auth-library");
const cloudinary = require("../config/cloudinaryConfig");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const jwtService = require("./JwtService");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const loginWithGoogle = async (idToken) => {
    try {

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;


        let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {

            user = new UserModel({
                user_name: name,
                email,
                googleId,
                isGoogleAccount: true,
                avatar: picture,
                role_id: new mongoose.Types.ObjectId("68c158d04aacbd32cdffce3b"),
            });
            await user.save();
        }

        if (user.status === false) {
            throw { status: "ERR", message: "Account is blocked" };
        }


        const populatedUser = await UserModel.findById(user._id).populate("role_id", "name -_id");
        const roleName = populatedUser?.role_id?.name || "customer";


        const accessToken = await jwtService.generalAccessToken({
            _id: user._id,
            isAdmin: roleName === "admin",
            role: roleName,
        });

        return {
            status: "OK",
            message: "Google login success",
            data: {
                _id: populatedUser._id,
                user_name: populatedUser.user_name,
                email: populatedUser.email,
                avatar: populatedUser.avatar,
                role_name: roleName,
                status: populatedUser.status,
                createdAt: populatedUser.createdAt,
                updatedAt: populatedUser.updatedAt,
            },
            token: {
                access_token: accessToken,
            },
        };
    } catch (error) {
        throw error;
    }
};

const loginUser = async ({ email, password }) => {
    try {
        const user = await UserModel.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        if (!user) throw { status: "ERR", message: "Account does not exist" };
        if (user.status === false) throw { status: "ERR", message: "Account is blocked" };

        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (!passwordMatch) throw { status: "ERR", message: "Incorrect password" };


        const populatedUser = await UserModel.findById(user._id).populate("role_id", "name -_id");
        const roleName = populatedUser?.role_id?.name || "customer";


        const accessToken = await jwtService.generalAccessToken({
            _id: user._id,
            isAdmin: roleName === "admin",
            role: roleName,
        });




        return {
            status: "OK",
            message: "Login success",
            data: {
                _id: populatedUser._id,
                user_name: populatedUser.user_name,
                email: populatedUser.email,
                avatar: populatedUser.avatar,
                role_name: populatedUser.role_id.name,
                phone: populatedUser.phone,
                address: populatedUser.address,
                status: populatedUser.status,
                createdAt: populatedUser.createdAt,
                updatedAt: populatedUser.updatedAt,
            },
            token: {
                access_token: accessToken,
            },
        };
    } catch (error) {
        throw error;
    }
};

const sendRegisterOTP = async (user_name, email, password, phone, address) => {
    const existingUser = await UserModel.findOne({ email });
    const existingUserName = await UserModel.findOne({ user_name });
    if (existingUser) {
        return { status: "ERR", message: "Email already registered!" };
    }

    if (existingUserName) {
        return { status: "ERR", message: "Username already taken!" };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await TempOTPModel.findOneAndUpdate(
        { email },
        {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            user_name,
            password,
            phone,
            address,
        },
        { upsert: true, new: true }
    );

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "🔐 OTP for Registration",
        html: `
        <div style="max-width: 400px; margin: 20px auto; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; background-color: #f9fff9; font-family: Arial, sans-serif; text-align: center;">
  <h2 style="color: #4CAF50; margin-bottom: 10px;">Your OTP Code</h2>
  <p style="font-size: 16px; color: #333;">
    Please use the following OTP to verify your account:
  </p>
  <div style="font-size: 24px; font-weight: bold; color: #ffffff; background-color: #4CAF50; padding: 10px 20px; border-radius: 8px; display: inline-block; letter-spacing: 2px;">
    ${otp}
  </div>
  <p style="margin-top: 15px; color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
</div>
`,
    });

    return { status: "OK", message: "OTP sent to email" };
};


const confirmRegisterOTP = async (otp) => {
    const tempRecord = await TempOTPModel.findOne({ otp });

    if (!tempRecord || tempRecord.expiresAt < Date.now()) {
        return { status: "ERR", message: "Invalid or expired OTP" };
    }

    const { user_name, email, password, phone, address } = tempRecord;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        return { status: "ERR", message: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customerRole = await RoleModel.findOne({ name: "customer" });

    const newUser = new UserModel({
        user_name,
        email,
        password: hashedPassword,
        role_id: customerRole._id,
        phone,
        address,
        avatar: "https://res.cloudinary.com/dkbsae4kc/image/upload/v1753147941/avatars/jrrdk9hkpwm70bkzte6u.jpg",
    });

    await newUser.save();
    await TempOTPModel.deleteOne({ email });

    return { status: "OK", message: "Register successfully" };
};


const sendResetPasswordOTP = async (email) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Email does not exist!");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    try {

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "🔒 Reset Password OTP",
            html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 10px;background-color:rgb(174, 216, 48);">
        <h2 style="color: #007bff; text-align: center;">🔐 Reset Your Password</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">We received a request to reset your password. Use the OTP below to proceed:</p>
        <div style="text-align: center; padding: 10px 20px; background-color: #f3f3f3; border-radius: 5px; font-size: 20px; font-weight: bold;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: red;">⚠️ This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
        <hr style="border: 0.5px solid #ddd;">
        <p style="text-align: center; font-size: 12px; color: #666;">&copy; 2024 Your Company. All rights reserved.</p>
      </div>
    `,
        });
    } catch (err) {
        return {
            status: "ERR",
            message: "Failed to send email. Please try again later.",
        };
    }


    return { status: "OK", message: "OTP send to email successfully." };
};

const resetPassword = async (email, otp, newPassword) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Account does not exist!");

    if (user.resetPasswordOTP !== otp) {
        throw new Error("OTP is invalid ");
    }

    if (user.resetPasswordExpires < Date.now()) {
        throw new Error("OTP is expired");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { status: "OK", message: "Reset password successfully!" };
};


module.exports = {
    sendResetPasswordOTP,
    resetPassword,
    sendRegisterOTP,
    confirmRegisterOTP,
    loginWithGoogle,
    loginUser,
};
