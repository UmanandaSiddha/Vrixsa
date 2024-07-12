import { NextFunction, Response } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Payment, { methodEnum } from "../models/paymentModel.js";
import { CustomRequest } from "../middlewares/auth.js";
import ErrorHandler from "../utils/errorHandler.js";

export const createPayment = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { amount, method } = req.body;

    if (!amount || !method) {
        return next(new ErrorHandler("Please provide an amount", 400));
    }

    if (!Object.values(methodEnum).includes(method)) {
        return next(new ErrorHandler("Method doesn't match", 400));
    }

    // Online Payment Handler Here

    const payment = await Payment.create({
        orderId: req.params.id,
        userId: req.user?._id,
        amount,
        method,
    });

    res.status(200).json({
        success: true,
        message: "Payment created successfully",
        payment
    });
});

export const getPayments = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const paymnets = await Payment.find({ userId: req.user?._id });

    if (!paymnets) {
        return next(new ErrorHandler("No Paymnets found", 404));
    }

    res.status(200).json({
        success: true,
        count: paymnets.length,
        paymnets,
    })
});

export const getPaymentById = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const payment = await Payment.findOne({ _id: req.params.id, userId: req.user?._id });
    
    if (!payment) {
        return next(new ErrorHandler("Payment not found", 404));
    }

    res.status(200).json({
        success: true,
        payment,
    })
});