import { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import Payment, { statusEnum } from "../../models/paymentModel.js";
import ErrorHandler from "../../utils/errorHandler.js";

export const updatePaymentStatus = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return next(new ErrorHandler("Payment not found", 404));
    }

    const { status } = req.body;

    if (!status) {
        return next(new ErrorHandler("Please provide a status", 400));
    }

    if (!Object.values(statusEnum).includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }

    payment.status = status;
    await payment.save();

    res.status(200).json({
        success: true,
        payment,
        message: "Payment status updated successfully"
    });
});