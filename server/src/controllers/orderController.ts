import { NextFunction, Response } from "express";
import { CustomRequest } from "../middlewares/auth.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Order, { IProductItem } from "../models/orderModel.js";
import ErrorHandler from "../utils/errorHandler.js";

export const createOrder = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {

    const { address, city, state, zipCode, country, itemArray } = req.body;

    if (!address || !city || !state || !zipCode || !country || !itemArray || !Array.isArray(itemArray)) {
        return next(new ErrorHandler("All fields are Required", 400));
    }

    if (itemArray.length === 0) {
        return next(new ErrorHandler("Order should have atleast 1 Product", 400));
    }

    const totalAmount = itemArray.reduce((acc: number, item: IProductItem) => {
        return acc + item.price * item.quantity;
    }, 0);

    if (totalAmount <= 0) {
        return next(new ErrorHandler("Total amount should be greater than zero", 400));
    }

    const order = await Order.create({
        userId: req.user?._id,
        items: itemArray,
        totalAmount,
        shippingAddress: {
            address,
            city,
            state,
            zipCode,
            country,
        }
    });

    res.status(200).json({
        success: true,
        message: "Order created successfully",
        order,
    });
});

export const getOrders = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const orders = await Order.find({ userId: req.user?._id });

    if (!orders) {
        return next(new ErrorHandler("No orders found", 404));
    }

    res.status(200).json({
        success: true,
        count: orders.length,
        orders,
    });
});

export const getOrderById = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user?._id }).populate("productId", "_id name images");
    
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});