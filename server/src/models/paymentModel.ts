import mongoose, { Schema, Document } from "mongoose";

export const methodEnum = {
    CREDIT_CARD: "credit_card",
    PAYPAL: "paypal",
    BITCOIN: "bitcoin",
    STRIPE: "stripe",
    RAZORPAY: "razorpay"
}

export const statusEnum = {
    PENDING: "pending",
    COMPLETED: "completed",
    REFUNDED: "refunded",
    EXPIRED: "expired",
    FAILED: "failed",
    PROCESSING: "processing",
    CANCELLED: "cancelled",
};

export interface IPayment extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    orderId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema: Schema<IPayment> = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.ObjectId,
            ref: "Order",
            required: true,
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        method: {
            type: String,
            enum: Object.values(statusEnum),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(statusEnum),
            default: statusEnum.PENDING
        }
    },
    {
        timestamps: true,
    }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
