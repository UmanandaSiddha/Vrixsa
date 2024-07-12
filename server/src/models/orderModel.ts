import mongoose, { Schema, Document } from "mongoose";

export const statusEnum = {
    PENDING: "pending",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
};

export interface IProductItem {
    productId: mongoose.Schema.Types.ObjectId;
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    items: IProductItem[];
    totalAmount: number;
    status: string;
    shippingAddress: {
        address: string,
        city: string,
        state: string,
        zipCode: string,
        country: string,
    }
    createdAt: Date;
    updatedAt: Date;
}

const productItemSchema: Schema<IProductItem> = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const orderSchema: Schema<IOrder> = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        items: {
            type: [productItemSchema],
            required: true,
            default: []
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(statusEnum),
            default: statusEnum.PENDING
        },
        shippingAddress: {
            address: {
                type: String,
                required: [true, "Please Enter Address"],
            },
            city: {
                type: String,
                required: [true, "Please Enter City"],
            },
            state: {
                type: String,
                required: [true, "Please Enter State"],
            },
            zipCode: {
                type: String,
                required: [true, "Please Enter Zip Code"],
            },
            country: {
                type: String,
                required: [true, "Please Enter Country"],
            },
        }
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
