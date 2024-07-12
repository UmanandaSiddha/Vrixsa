import mongoose, { Schema, Document } from "mongoose";

export interface QInventory extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    productId: mongoose.Schema.Types.ObjectId;
    quantity: number;
    restockLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

const inventorySchema: Schema<QInventory> = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        restockLevel: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const Inventory = mongoose.model<QInventory>("Inventory", inventorySchema);
export default Inventory;
