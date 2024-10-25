import { Request, Response, NextFunction, CookieOptions } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IDevice, IUser } from "../models/user.model.js";
import { StatusCodes } from "http-status-codes";
import ErrorHandler from "../utils/errorHandler.js";

export interface CustomRequest extends Request {
	user?: IUser;
}

export const authenticate = async (req: CustomRequest, res: Response) => {
	const accessToken = req.cookies["_session"] as string | undefined;
	const refreshToken = req.cookies["_gsession"] as string | undefined;
	const deviceId = req.cookies["_device"] as string | undefined;

	if (!accessToken) {
		throw new ErrorHandler("Unauthorized access", StatusCodes.FORBIDDEN)
	}

	try {
		const decoded = jwt.verify(accessToken!, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload & { id: string, email: string, role: string };
		const user = await User.findById(decoded.id);
		if (!user) {
			throw new ErrorHandler("User not found", StatusCodes.NOT_FOUND)
		}
		if (user.isBlocked) {
			throw new ErrorHandler("Your account has been blocked", StatusCodes.FORBIDDEN);
		}

		return user;
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError && refreshToken) {
			try {
				const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload & { id: string };
				const user = await User.findById(decodedRefresh.id);

				if (!user) {
					throw new ErrorHandler("User not found", StatusCodes.NOT_FOUND);
				}
				if (user.isBlocked) {
					throw new ErrorHandler("Your account has been blocked", StatusCodes.FORBIDDEN);
				}

				const source = req.useragent;
				if (!source) {
					throw new ErrorHandler("Unable to verify device information", StatusCodes.BAD_REQUEST);
				}
				const deviceType = source?.isMobile ? 'Mobile' : source?.isTablet ? 'Tablet' : source?.isDesktop ? 'Desktop' : 'Unknown';

				if (deviceId && user.devices.some((data: IDevice) => (data.refreshToken === refreshToken && data.deviceId === deviceId))) {
					const deviceData = user.devices.find((data: IDevice) => data.deviceId === deviceId);
					if (deviceData && (deviceData.deviceType !== deviceType || deviceData.os !== source?.os)) {
						throw new ErrorHandler("Device mismatch", StatusCodes.FORBIDDEN);
					}
				} else {
					throw new ErrorHandler("Invalid refresh token", StatusCodes.FORBIDDEN);
				}

				const newAccessToken = user.generateAccessToken();
				const expireTime = Number(process.env.ACCESS_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000;

				const options: CookieOptions = {
					expires: new Date(Date.now() + expireTime),
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: 'strict',
				};

				res.cookie("_session", newAccessToken, options);

				return user;
			} catch (refreshErr) {
				throw new ErrorHandler("Invalid or expired refresh token, please log in again", StatusCodes.UNAUTHORIZED);
			}
		} else {
			throw new ErrorHandler("Unauthorized access", StatusCodes.UNAUTHORIZED);
		}
	}
}

export const isAuthenticatedUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const user = await authenticate(req, res);
		req.user = user;
		next();
	} catch (error) {
		const statusCode = (error instanceof ErrorHandler) ? error.statusCode : 500;
		const message = (error instanceof ErrorHandler) ? error?.message : "Internal Server Error";
		return next(new ErrorHandler(message, statusCode));
	}
}

export const isUserVerified = async (req: CustomRequest, res: Response, next: NextFunction) => {
	try {
		if (!req.user?.isVerified) {
			return next(new ErrorHandler("Please verify your email to access this resource", StatusCodes.UNAUTHORIZED));
		}
		next();
	} catch (error) {
		return next(new ErrorHandler("You are not authorized to access this route", StatusCodes.FORBIDDEN));
	}
};

export const authorizeRoles = (...roles: string[]) => {
	return (req: CustomRequest, res: Response, next: NextFunction) => {
		try {
			if (!req.user || !roles.includes(req.user.role)) {
				return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, StatusCodes.UNAUTHORIZED));
			}
			next();
		} catch (error) {
			return next(new ErrorHandler("You are not authorized to access this route", StatusCodes.FORBIDDEN));
		}
	};
};