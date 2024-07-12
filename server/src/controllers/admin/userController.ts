import { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import User, { roleEnum } from "../../models/userModel.js";
import ErrorHandler from "../../utils/errorHandler.js";
import ApiFeatures from "../../utils/apiFeatures.js";

export const updateUserRole = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { role } = req.body;

    if (!role) {
        return next(new ErrorHandler("Please provide a role", 400));
    }

    if (!Object.values(roleEnum).includes(role)) {
        return next(new ErrorHandler("Invalid role", 400));
    }

    await User.findByIdAndUpdate(
        req.params.id, 
        { role }, 
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        message: "User role updated",
    });
});

export const getAllUsers = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const resultPerPage = 10;
    const count = await User.countDocuments();

    const apiFeatures = new ApiFeatures(User.find(), req.query).search().filter();

    let filteredUsers = await apiFeatures.query;
    let filteredUsersCount = filteredUsers.length;

    apiFeatures.pagination(resultPerPage);
    filteredUsers = await apiFeatures.query.clone();

    return res.status(200).json({
        success: true,
        count,
        resultPerPage,
        filteredUsers,
        filteredUsersCount
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
    });
});