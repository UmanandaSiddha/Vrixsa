import mongoose, { Schema, Document } from "mongoose";

export const typeEnum = {
    NEW_PRODUCT: "new_product",
    ORDER_PLACED: "order_placed",
    ORDER_CANCELLED: "order_cancelled",
    ORDER_UPDATED: "order_updated",
};

export interface INotification extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema: Schema<INotification> = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(typeEnum),
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
