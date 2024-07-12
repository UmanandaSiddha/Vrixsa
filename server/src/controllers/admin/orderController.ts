import { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import Order, { statusEnum } from "../../models/orderModel.js";
import ErrorHandler from "../../utils/errorHandler.js";

export const updateOrderStatus = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    const { status } = req.body;

    if (!status) {
        return next(new ErrorHandler("Please provide a status", 400));
    }

    if (!Object.values(statusEnum).includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }

    order.status = status;
    await order.save();

    res.status(200).json({
        success: true,
        order,
        message: "Order status updated successfully"
    });
});