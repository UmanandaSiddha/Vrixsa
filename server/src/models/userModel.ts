import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const roleEnum = {
    USER: "user",
    ADMIN: "admin",
};

export const themeEnum = {
    LIGHT: "light",
    DARK: "dark",
};

export interface IUser extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profile: {
        address?: string;
        phone?: string;
        avatarUrl?: string;
    }
    settings: {
        notificationsEnabled: boolean;
        theme: string;
    }
    role: string;
    isVerified: boolean;
    oneTimePassword?: string;
    oneTimeExpire?: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    createdAt: Date;
    updatedAt: Date;

    getJWTToken(): string;
    comparePassword(enteredPassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
    getOneTimePassword(): string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please Enter your Name"],
            maxLength: [30, "Name cannot exceed 30 characters"],
            minLength: [4, "Name should have more than 4 characters"],
        },
        email: {
            type: String,
            required: [true, "Please Enter your Email"],
            unique: true,
            validate: [validator.isEmail, "Please enter a valid Email"],
        },
        password: {
            type: String,
            required: [true, "Please Enter your Password"],
            minLength: [8, "Password should have more than 8 characters"],
            select: false,
        },
        profile: {
            address: String,
            phone: String,
            avatarUrl: String,
        },
        settings: {
            notificationsEnabled: {
                type: Boolean,
                default: true,
            },
            theme: {
                type: String,
                enum: Object.values(themeEnum),
                default: themeEnum.LIGHT,
            },
        },
        role: {
            type: String,
            enum: Object.values(roleEnum),
            default: roleEnum.USER,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        oneTimePassword: String,
        oneTimeExpire: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    }
);

// Password Hash
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// JWT Token
userSchema.methods.getJWTToken = function (this: IUser) {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Compare Password
userSchema.methods.comparePassword = async function (this: IUser, enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function (this: IUser) {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    return resetToken;
};

// Generating One Time Password
userSchema.methods.getOneTimePassword = function (this: IUser) {
    const otp = Math.floor(100000 + Math.random() * 900000);

    this.oneTimePassword = crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");

    this.oneTimeExpire = new Date(Date.now() + 15 * 60 * 1000);

    return otp.toString();
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
