import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import fs from "fs";
import { addEmailToQueue } from "../utils/emailQueue.js";
import { NextFunction, Request, Response } from "express";
import path from "path";
import User from "../models/user.model.js";
import { CustomRequest } from "../middlewares/auth.middleware.js";

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

// update profile picture
export const uploadProfilePicture = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const filename = req.file ? `${process.env.SERVER_URL}/avatars/${req.file.filename}` : "";

    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (req.file && user.profilePicture && user.profilePicture.length > 0) {
        const basename = user.profilePicture.split('/').pop() || "";
        const imagePath = path.join('./public/avatars', basename);
        try {
            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    const newUser = await User.findByIdAndUpdate(
        req.user?._id,
        { avatar: filename },
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        file: filename,
        message: "Profile updated successfully"
    });
});

// User Logout
export const logoutUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("_session", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});