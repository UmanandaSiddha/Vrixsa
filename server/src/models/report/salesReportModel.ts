import mongoose, { Schema, Document } from "mongoose";

export interface ISalesReport extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    reportId: string;
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalOrders: number;
    totalRevenue: number;
    createdAt: Date;
    updatedAt: Date;
}

const salesReportSchema: Schema<ISalesReport> = new mongoose.Schema(
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
        totalSales: {
            type: Number,
            required: true
        },
        totalOrders: {
            type: Number,
            required: true
        },
        totalRevenue: {
            type: Number,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const SalesReport = mongoose.model<ISalesReport>("SalesReport", salesReportSchema);
export default SalesReport;
