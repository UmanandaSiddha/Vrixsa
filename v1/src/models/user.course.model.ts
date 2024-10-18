import mongoose, { Document, Schema } from "mongoose";

export interface IUserCourse extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    courseId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    paymentId: mongoose.Schema.Types.ObjectId;
    settings: {
        notifications: boolean;
    }
    createdAt: Date;
    updatedAt: Date;
}