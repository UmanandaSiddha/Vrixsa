import mongoose, { Schema, Document } from "mongoose";

export interface IReview {
    userId: mongoose.Schema.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
}

export interface IProduct extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: string[];
    reviews: IReview[];
    ratings: {
        averageRating: number;
        totalRatings: number;
    }
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema: Schema<IReview> = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        comment: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    { _id: false }
)

const productSchema: Schema<IProduct> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please Enter Product Name"],
            maxLength: [15, "Name cannot exceed 15 characters"],
            minLength: [4, "Name should have more than 4 characters"],
        },
        description: {
            type: String,
            required: [true, "Please Enter Product Description"],
            maxLength: [50, "Description cannot exceed 50 characters"],
            minLength: [4, "Description should have more than 4 characters"],
        },
        price: {
            type: Number,
            required: [true, "Please Enter Product Price"],
        },
        stock: {
            type: Number,
            required: [true, "Please Enter Product Stock"],
        },
        category: {
            type: String,
            required: [true, "Please Enter Product Category"],
        },
        images: [String],
        reviews: {
            type: [reviewSchema],
            required: true,
            default: []
        },
        ratings: {
            averageRating: {
                type: Number,
                default: 0,
            },
            totalRatings: {
                type: Number,
                default: 0,
            }
        }
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
