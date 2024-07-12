import mongoose, { Schema, Document } from "mongoose";

export interface IFinancialReport extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    reportId: string;
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    createdAt: Date;
    updatedAt: Date;
}

const financialReportSchema: Schema<IFinancialReport> = new mongoose.Schema(
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
        totalRevenue: {
            type: Number,
            required: true
        },
        totalExpenses: {
            type: Number,
            required: true
        },
        netProfit: {
            type: Number,
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const FinancialReport = mongoose.model<IFinancialReport>("FinancialReport", financialReportSchema);
export default FinancialReport;
