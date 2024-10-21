import { CookieOptions, Response } from "express";
import { IUser } from "../models/user.model.js";

const generateOptions = (expireTime: number) => {
    if (isNaN(expireTime)) {
        throw new Error("Invalid COOKIE_EXPIRE environment variable");
    }

    const options: CookieOptions = {
        expires: new Date(Date.now() + (expireTime * 24 * 60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
    };
    
    return options;
}

const sendToken = (user: IUser, res: Response, deviceId?: string): void => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const accessTokenOptions = generateOptions(Number(process.env.ACCESS_COOKIE_EXPIRE));
    const refreshTokenOptions = generateOptions(Number(process.env.REFRESH_COOKIE_EXPIRE));

    if (deviceId) {
        const deviceIdOptions = generateOptions(365);
        res.cookie("_device", deviceId, deviceIdOptions);
    }

    res.cookie("_session", accessToken, accessTokenOptions);
    res.cookie("_gsession", refreshToken, refreshTokenOptions);
};

export default sendToken;