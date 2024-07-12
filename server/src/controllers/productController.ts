import { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/productModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { CustomRequest } from "../middlewares/auth.js";
import ApiFeatures from "../utils/apiFeatures.js";

export const getAllProducts = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    
    const resultPerPage = 10;
    const count = await Product.countDocuments();

    const apiFeatures = new ApiFeatures(Product.find(), req.query).search().filter();

    // let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[gte]=${price[0]}&price[lte]=${price[1]}&ratings[gte]=${ratings}`;

    // if (category) {
    //     link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[gte]=${price[0]}&price[lte]=${price[1]}&category=${category}&ratings[gte]=${ratings}`;
    // }

    let filteredProducts = await apiFeatures.query;
    let filteredProductsCount = filteredProducts.length;

    apiFeatures.pagination(resultPerPage);
    filteredProducts = await apiFeatures.query.clone();

    return res.status(200).json({
        success: true,
        count,
        resultPerPage,
        filteredProducts,
        filteredProductsCount
    });
});

export const getProductById = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

export const createReview = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const { rating, comment } = req.body;

    if (!rating) {
        return next(new ErrorHandler("Please provide a rating", 400));
    }

    const existingReview = product.reviews.find(review => review.userId.toString() === req.user?._id.toString());

    if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment || "";
    } else {
        product.reviews.push({
            userId: req.user?.id,
            rating,
            comment: comment || "",
            createdAt: new Date(),
        });
        product.ratings.totalRatings = product.reviews.length;
    }

    const totalRatings = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    product.ratings.averageRating = totalRatings / product.reviews.length;

    await product.save();

    res.status(200).json({
        success: true,
        message: "Review added successfully",
        product,
    });
});

export const deleteReview = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const reviewIndex = product.reviews.findIndex(review => review.userId.toString() === req.user?.id.toString());

    if (reviewIndex === -1) {
        return next(new ErrorHandler("Review not found", 404));
    }

    product.reviews.splice(reviewIndex, 1);
    product.ratings.totalRatings = product.reviews.length;

    const totalRatings = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    product.ratings.averageRating = product.reviews.length > 0 ? totalRatings / product.reviews.length : 0;

    await product.save();

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        product,
    });
});