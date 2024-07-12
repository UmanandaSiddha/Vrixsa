import { NextFunction, Response } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { CustomRequest } from "../middlewares/auth.js";
import Notification from "../models/notificationModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import User from "../models/userModel.js";

export const getNotifications = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const notifications = await Notification.find({ userId: req.user?._id });

    if (!notifications) {
        return next(new ErrorHandler("No notifications found", 404));
    }

    res.status(200).json({
        success: true,
        count: notifications.length,
        notifications,
    });
});

export const getNotificationById = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user?._id });

    if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
    }

    res.status(200).json({
        success: true,
        notification,
    });
});

export const markNotificationAsRead = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user?._id });

    if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
    }

    await Notification.findByIdAndUpdate(
        req.params.id, 
        { isRead: true }, 
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        message: "Successfully marked notification as read"
    });
});

export const updateNotificationSettings = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    await User.findByIdAndUpdate(
        req.user?._id, 
        { 
            $set: { 
                'settings.notificationsEnabled': !user.settings.notificationsEnabled,
            }
        }, 
        { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
        success: true,
        message: "Settings updated successfully"
    });
});

export const deleteNotification = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user?._id });

    if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Successfully deleted notification"
    });
});