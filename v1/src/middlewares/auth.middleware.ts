import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/user.model.js";

export interface CustomRequest extends Request {
    user?: IUser;
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) return res.status(403).json({ message: "Access token required" });

    try {
        // Attempt to verify the access token
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(403).json({ message: "Invalid access token" });
        }
        req.user = user;
        next();
    } catch (err) {
        // If access token expired, attempt to verify the refresh token and generate a new access token
        if (err instanceof jwt.TokenExpiredError && refreshToken) {
            try {
                const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
                const user = await User.findById(decodedRefresh.userId);

                if (!user || user.refreshToken !== refreshToken) {
                    return res.status(403).json({ message: "Invalid refresh token" });
                }

                const newAccessToken = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_SECRET!, {
                    expiresIn: "15m",
                });

                // Optional: Send new access token in response headers
                res.setHeader("Authorization", `Bearer ${newAccessToken}`);
                req.user = user;
                next();
            } catch (refreshErr) {
                return res.status(401).json({ message: "Invalid or expired refresh token, please log in again" });
            }
        } else {
            // Other errors (like invalid token)
            return res.status(401).json({ message: "Unauthorized access" });
        }
    }
};