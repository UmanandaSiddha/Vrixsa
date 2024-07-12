import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler.js";

interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    keyValue?: { [key: string]: string };
    path?: string;
}

const ErrorMiddleware =  (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

     // Wrong MongoDb Id Error
     if (err.name === "CastError") {
        const errorMessage = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(errorMessage, 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const errorMessage = `Duplicate ${Object.keys(err.keyValue || {})} Entered`;
        err = new ErrorHandler(errorMessage, 400);
    }

    // Wrong JWT Error
    if (err.name === "TokenExpiredError") {
        const errorMessage = `Json Web Token is Expired, Try again later`;
        err = new ErrorHandler(errorMessage, 400);
    }

    // JWT Expire Error
    if (err.name === "JsonWebTokenError") {
        const errorMessage = `Json Web Token is Invalid, Try again later`;
        err = new ErrorHandler(errorMessage, 400);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || message,
    });
}

export default ErrorMiddleware;