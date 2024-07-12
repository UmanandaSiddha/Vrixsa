import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User, { roleEnum, themeEnum } from "../models/userModel.js";
import sendToken from "../utils/jwtToken.js";
import crypto from "crypto";
import fs from "fs";
import { addEmailToQueue } from "../utils/emailQueue.js";
import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../middlewares/auth.js";
import path from "path";

// User Registration
export const registerUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, address, phone } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter Name, Email and Password", 400));
    }

    const user = await User.create({
        name,
        email,
        profile: {
            address,
            phone,
            avatarUrl: req.file ? `${process.env.SERVER_URL}/avatars/${req.file.filename}` : "",
        },
        password,
    });

    if (!user) {
        return next(new ErrorHandler("Error Registering User, Try Again Later", 500));
    }

    if (email === process.env.ADMIN_EMAIL) {
        user.role = roleEnum.ADMIN;
        await user.save();
    }

    // if (image) {
    //     const data = image.replace(/^data:image\/\w+;base64,/, "");
    //     const buffer = Buffer.from(data, 'base64');

    //     try {
    //         const resizedImageBuffer = await sharp(buffer)
    //             .resize({ width: 300 })
    //             .jpeg({ quality: 50 })
    //             .toBuffer();

    //         await fs.promises.writeFile(`./public/avatars/${user._id}.jpg`, resizedImageBuffer);
    //         console.log('Data has been written to the file');

    //         user.profile.avatarUrl = `${process.env.SERVER_URL}/avatars/${user._id}.jpg`;
    //         await user.save();
    //     } catch (err) {
    //         console.error('Error processing or writing the image:', (err as Error).message);
    //     }
    // }

    const otp = user.getOneTimePassword();
    await user.save({ validateBeforeSave: false });

    const message = `Email verification OTP ( valid for 15 minutes ) :- \n\n ${otp} \n\n Please ignore if you didn't requested this email.`;

    try {
        await addEmailToQueue({
            email: user.email,
            subject: `Email Veification`,
            message,
        });
    } catch (error) {
        user.oneTimePassword = undefined;
        user.oneTimeExpire = undefined;
        await user.save({ validateBeforeSave: false });
    }

    sendToken(user, 201, res);
});

// Request Verification Email
export const requestVerification = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const otp = user.getOneTimePassword();
    await user.save({ validateBeforeSave: false });

    const message = `Email verification OTP ( valid for 15 minutes ) :- \n\n ${otp} \n\n Please ignore if you didn't requested this email.`;

    try {
        await addEmailToQueue({
            email: user.email,
            subject: `Email Veification`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (error) {
        user.oneTimePassword = undefined;
        user.oneTimeExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler((error as Error).message, 500));
    }
});

// User Verification
export const verifyUser = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { otp } = req.body;

    if (!otp) {
        return next(new ErrorHandler("Please enter OTP", 400));
    }

    const oneTimePassword = crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");

    const user = await User.findOne({
        _id: req.user?._id,
        oneTimePassword,
        oneTimeExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Email Veification OTP has Expired", 400));
    }

    user.isVerified = true;
    user.oneTimePassword = undefined;
    user.oneTimeExpire = undefined;

    
    const savedUser = await user.save();

    const message = savedUser
        ? "Account Verified Successfully!!"
        : "Account Verification Failed, Please try again later.";

    try {
        await addEmailToQueue({
            email: user.email,
            subject: `Account Verification Update`,
            message,
        });
    } catch (error) {
        console.log((error as Error).message);
    }

    sendToken(user, 200, res);
});

// User Login
export const loginUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter Email and Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Credentials", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Credentials", 401));
    }

    sendToken(user, 200, res);
});

// Update Password
export const resetPassword = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
        return next(new ErrorHandler("All fields are required", 404));
    }

    const isPasswordMatched = await user.comparePassword(oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    user.password = newPassword;

    await user.save();

    sendToken(user, 200, res);
});

// Request Forgot Email
export const requestForgot = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("User not Found", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset?token=${resetToken}&user=${user._id}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n Please ignore if you didn't requested this email.`;

    try {
        await addEmailToQueue({
            email: user.email,
            subject: `Password Recovery`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler((error as Error).message, 500));
    }
});

// Forgot Password And Update
export const forgotPassword = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const {token} = req.params;

    if (token) {
        return next(new ErrorHandler("Broken Link", 500));
    }

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        _id: req.body.user,
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Reset Password Token is Invalid or has Expired", 400));
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return next(new ErrorHandler("All fields are required", 404));
    }

    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
});

// Update Settings
export const updateSettings = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { notificationsEnabled, theme } = req.body;

    if (theme && !Object.values(themeEnum).includes(theme)) {
        return next(new ErrorHandler("Theme can be either light or dark", 400));
    }

    await User.findByIdAndUpdate(
        req.user?._id, 
        { 
            settings: {
                notificationsEnabled,
                theme,
            }
        }, 
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        message: "Settings updated successfully"
    });
});

// Update Profile
export const updateProfile = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { address, phone } = req.body;

    if (req.file && user.profile?.avatarUrl && user.profile?.avatarUrl.length > 0) {
        const filename = path.basename(user.profile.avatarUrl);
        const imagePath = path.join(__dirname, '..', 'public', 'avatars', filename);
        try {
            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    const updatedProfile = {
        address: address || user.profile.address,
        phone: phone || user.profile.phone,
        avatarUrl: req.file ? `${process.env.SERVER_URL}/uploads/avatars/${req.file.filename}` : user.profile.avatarUrl
    };

    await User.findByIdAndUpdate(
        req.user?._id, 
        { profile: updatedProfile }, 
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        message: "Profile updated successfully"
    });
});

// Get User
export const getUser = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// User Logout
export const logoutUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});