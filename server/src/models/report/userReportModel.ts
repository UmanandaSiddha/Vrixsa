import mongoose, { Schema, Document } from "mongoose";

export interface IUserReport extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    reportId: string;
    startDate: Date;
    endDate: Date;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    createdAt: Date;
    updatedAt: Date;
}

const userReportSchema: Schema<IUserReport> = new mongoose.Schema(
    {
        reportId: {
            type: String,
            required: true
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalUsers: {
            type: Number,
            required: true
        },
        newUsers: {
            type: Number,
            required: true
        },
        activeUsers: {
            type: Number,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const UserReport = mongoose.model<IUserReport>("UserReport", userReportSchema);
export default UserReport;
