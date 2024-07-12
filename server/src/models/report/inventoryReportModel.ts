import mongoose, { Schema, Document } from "mongoose";

export interface IStockItem {
    productId: mongoose.Schema.Types.ObjectId;
    name: string;
    stock: number;
}

export interface IInventoryReport extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    reportId: string;
    startDate: Date;
    endDate: Date;
    lowStockItems: IStockItem[];
    outOfStockItems: IStockItem[];
    createdAt: Date;
    updatedAt: Date;
}

const stockItemSchema: Schema<IStockItem> = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const inventoryReportSchema: Schema<IInventoryReport> = new mongoose.Schema(
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
        lowStockItems: {
            type: [stockItemSchema],
            required: true,
            default: []
        },
        outOfStockItems: {
            type: [stockItemSchema],
            required: true,
            default: []
        }
    },
    {
        timestamps: true,
    }
);

const InventoryReport = mongoose.model<IInventoryReport>("InventoryReport", inventoryReportSchema);
export default InventoryReport;
