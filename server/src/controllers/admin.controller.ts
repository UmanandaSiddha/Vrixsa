import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from "http-status-codes";
import User, { UserRoleEnum } from '../models/user.model.js';
import { CustomRequest } from '../middlewares/auth.middleware.js';
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';

export const getAllUsers = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find();

    res.status(StatusCodes.OK).json({
        success: true,
        data: users,
        count: users.length
    });
});

export const getUserById = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user,
        message: "User role updated successfully"
    });
});

export const toggleBlockUser = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (String(req.user?._id) === req.params.id) {
        return next(new ErrorHandler("Cannot block or unblock yourself", 400));
    }

    const newUser = await User.findById(
        user._id, 
        { isBlocked: !user.isBlocked },
        { new: true, runValidators: true, useFindAndModify: false }
    )

    res.status(200).json({
        success: true,
        user: newUser,
        message: `User ${!user.isBlocked ? "Blocked" : "Unlocked"}`
    });
});

export const updatedUserRole = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (String(req.user?._id) === req.params.id) {
        return next(new ErrorHandler("Changing self role is prohibited", 400));
    }

    const { role } = req.body;
    if (!role) {
        return next(new ErrorHandler("Please provide a role", 400));
    }

    if (!Object.values(UserRoleEnum).includes(role)) {
        return next(new ErrorHandler("Invalid role", 400));
    }

    if (user.role === role) {
        return next(new ErrorHandler(`User is already set to ${role} role`, 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        { role },
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        user: updatedUser,
        message: "User role updated successfully"
    });
});