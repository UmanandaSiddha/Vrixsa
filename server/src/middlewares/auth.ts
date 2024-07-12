import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import User, { IUser } from "../models/userModel.js";

export interface CustomRequest extends Request {
    user?: IUser;
}

export const isAuthenticatedUser = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token as string | undefined;

    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id: string };
    const user = await User.findById(decodedToken.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    req.user = user;
    next();
});

export const isUserVerified = catchAsyncErrors(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user?.isVerified) {
        return next(new ErrorHandler("Please verify your email to access this resource", 401));
    }
    next();
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
