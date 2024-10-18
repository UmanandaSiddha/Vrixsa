import { CookieOptions } from "express";
import { IUser } from "../models/user.model.js";

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenOptions: CookieOptions;
    refreshTokenOptions: CookieOptions;
}

const generateOptions = (expireTime: number) => {
    if (isNaN(expireTime)) {
        throw new Error("Invalid COOKIE_EXPIRE environment variable");
    }

    const options: CookieOptions = {
        expires: new Date(
            Date.now() + expireTime
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
    };
    
    return options;
}

const sendToken = async (user: IUser): Promise<TokenResponse> => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.save({ validateBeforeSave: false });

    const cookieExpireDays = Number(process.env.REFRESH_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000;
    const cookieExpireMinutes = Number(process.env.ACCESS_COOKIE_EXPIRE) * 60 * 1000;

    const accessTokenOptions = generateOptions(cookieExpireMinutes);
    const refreshTokenOptions = generateOptions(cookieExpireDays);

    return {
        accessToken,
        refreshToken,
        accessTokenOptions,
        refreshTokenOptions,
    }
};

export default sendToken;