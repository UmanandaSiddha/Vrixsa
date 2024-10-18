import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User, { roleEnum, accountEnum, requestEnum } from "../models/userModel.js";
import sendToken from "../utils/jwtToken.js";
import crypto from "crypto";
import fs from "fs";
import { addEmailToQueue } from "../utils/emailQueue.js";
import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../middlewares/auth.js";
import path from "path";
import { firebaseAdmin } from "../config/firebase-admin.js";

// User Registration
export const registerUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter Name, Email and Password", 400));
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (!user) {
        return next(new ErrorHandler("Error Registering User, Try Again Later", 500));
    }

    if (email === process.env.ADMIN_EMAIL) {
        user.role = roleEnum.ADMIN;
        await user.save();
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

    if (user.isBlocked) {
        return next(new ErrorHandler("Account is blocked", 403));
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

// Set Password
export const setPassword = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id).select("+password");
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user.account.includes(accountEnum.EMAIL)) {
        return next(new ErrorHandler("Password already Saved", 400));
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return next(new ErrorHandler("All fields are required", 404));
    }

    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    user.password = newPassword;
    user.account = [...user.account, accountEnum.EMAIL];

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
    const { token } = req.params;

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

// Request to become Creator
export const createCreatorRequest = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const newUser = await User.findByIdAndUpdate(
        req.user?._id,
        { request: requestEnum.PENDING },
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        user: newUser,
        message: "Creator Request Added"
    });
});

// Update Profile Info
export const updateProfile = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { name, bio, socials } = req.body;

    const formattedSocials = Object.entries(socials).map(([platform, url]) => ({
        platform,
        url,
    }));

    const updatedProfile = {
        name: name || user.name,
        bio: bio || user.bio,
        socials: formattedSocials.length ? formattedSocials : user.socials,
    };

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        updatedProfile,
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully"
    });
});

// update profile picture
export const uploadProfilePicture = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const filename = req.file ? `${process.env.SERVER_URL}/avatars/${req.file.filename}` : "";

    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (req.file && user.avatar && user.avatar.length > 0) {
        const basename = user.avatar.split('/').pop() || "";
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
        user: newUser,
        message: "Profile updated successfully"
    });
});

// Get All Authors
export const getAllAuthors = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({ role: roleEnum.CREATOR });
    const count = await User.countDocuments({ role: roleEnum.CREATOR });

    res.status(200).json({
        success: true,
        users,
        count
    });
});

// Get Author By ID
export const getAuthor = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user.role !== roleEnum.CREATOR) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user
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

export const googleLogin = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    if (!token) {
        return next(new ErrorHandler("Token not found", 404));
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    if (!decodedToken) {
        return next(new ErrorHandler("Google Auth Failed", 404));
    }
    const { uid, email, name, picture, email_verified } = decodedToken;
    const user = await User.findOne({ email });

    if (user) {
        if (user?.googleId === uid) {
            sendToken(user, 201, res);
        } else {
            user.googleId = uid;
            user.account.push(accountEnum.GOOGLE);
            if (user?.avatar?.length === 0) {
                user.avatar = picture;
            }
            if (email === process.env.ADMIN_EMAIL) {
                user.role = roleEnum.ADMIN;
                await user.save();
            }
            await user.save();
            sendToken(user, 201, res);
        }
    } else {
        const newUser = await User.create({
            name,
            email,
            avatar: picture,
            account: [accountEnum.GOOGLE],
            isVerified: email_verified,
            role: email === process.env.ADMIN_EMAIL? roleEnum.ADMIN : roleEnum.USER,
            googleId: uid
        });
        sendToken(newUser, 201, res);
    }
});