import { CookieOptions, Response } from "express";
import { IUser } from "../models/userModel.js";

const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const token = user.getJWTToken();

    const cookieExpireDays = Number(process.env.COOKIE_EXPIRE);
    if (isNaN(cookieExpireDays)) {
        throw new Error("Invalid COOKIE_EXPIRE environment variable");
    }

    const options: CookieOptions = {
        expires: new Date(
            Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    });
};

export default sendToken;