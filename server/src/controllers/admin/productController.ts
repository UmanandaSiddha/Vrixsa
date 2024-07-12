import { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import Product from "../../models/productModel.js";
import ErrorHandler from "../../utils/errorHandler.js";
import path from "path";
import fs from "fs";

export const createProduct = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
        return next(new ErrorHandler("Please provide Name, Description, Price, Stock, and Category", 400));
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next(new ErrorHandler("Please upload at least one image", 400));
    }

    for (const file of req.files) {
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorHandler("Please upload only images", 400));
        }
    }

    const images = req.files?.map((file: Express.Multer.File) => {
        return `${process.env.SERVER_URL}/products/${file.filename}`;
    });

    const product = await Product.create({
        name,
        description,
        price,
        stock,
        category,
        images,
    });

    res.status(201).json({
        success: true,
        product
    });
});

export const updateProductDetails = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const { name, description, price, stock, category } = req.body;

    const updateFields: Partial<typeof product> = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (price) updateFields.price = price;
    if (stock) updateFields.stock = stock;
    if (category) updateFields.category = category;

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true, useFindAndModify: false }
    );

    if (!updatedProduct) {
        return next(new ErrorHandler("Failed to update product", 500));
    }

    res.status(200).json({
        success: true,
        product: updatedProduct,
        message: "Product updated successfully"
    });
});

export const addProductImages = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next(new ErrorHandler("Please upload at least one image", 400));
    }

    const newImages = req.files?.map((file: Express.Multer.File) => {
        return `${process.env.SERVER_URL}/products/${file.filename}`;
    });

    product.images.push(...newImages);

    await product.save();

    res.status(200).json({
        success: true,
        product,
        message: "New images added successfully"
    });
});

export const deleteProductImages = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const { imagesToDelete } = req.body;

    if (!imagesToDelete || !Array.isArray(imagesToDelete) || imagesToDelete.length === 0) {
        return next(new ErrorHandler("Please provide images to delete", 400));
    }

    for (const imageURL of imagesToDelete) {
        const index = product.images.indexOf(imageURL);
        if (index !== -1) {
            const filename = path.basename(imageURL);
            const imagePath = path.join(__dirname, '..', 'public', 'products', filename);
            try {
                if (fs.existsSync(imagePath)) {
                    await fs.promises.unlink(imagePath);
                }
            } catch (error) {
                console.error('Error deleting image:', error);
            }
            product.images.splice(index, 1);
        }
    }

    await product.save();

    res.status(200).json({
        success: true,
        product,
        message: "Images deleted successfully"
    });
});

export const deleteAllProductImages = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    for (const imageURL of product.images) {
        const filename = path.basename(imageURL);
        const imagePath = path.join(__dirname, '..', 'public', 'products', filename);
        try {
            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    product.images = [];

    await product.save();

    res.status(200).json({
        success: true,
        product,
        message: "All images deleted successfully"
    });
});

export const deleteProduct = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    for (const image of product.images) {
        const filePath = path.join(__dirname, '..', 'public', 'products', path.basename(image));
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});