import mongoose, { Schema, Document } from "mongoose";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import crypto from "crypto";

export const UserRoleEnum = {
    USER: "USER",
    ADMIN: "ADMIN",
} as const;

export const UserAccountEnum = {
    EMAIL: "EMAIL",
    GOOGLE: "GOOGLE",
    GITHUB: "GITHUB",
} as const;

export interface IDevice extends Document {
    deviceId: string;
    deviceType: string;
    ipAddress: string;
    lastLogin: Date;
    userAgent: string;
}

export interface IBillingInfo {
    phoneNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }
}

export interface IUser extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    profilePicture?: string;
    phoneNumber?: string;
    role: typeof UserRoleEnum[keyof typeof UserRoleEnum];
    account: Array<typeof UserAccountEnum[keyof typeof UserAccountEnum]>;
    isBlocked: boolean;
    isVerified: boolean;
    googleId: string;
    githubId: string;
    isDeactivated: boolean;
    deactivateReason?: string;
    deactivateTime?: Date;
    devices: IDevice[];
    billingInfo: IBillingInfo;
    latestSubsciption: mongoose.Schema.Types.ObjectId;
    loginAttempt: {
        count: number;
        lastLogin: Date;
    },
    createdAt: Date;
    updatedAt: Date;

    getJWTToken(): string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
    {
        firstName: { 
            type: String, 
            required: true 
        },
        lastName: { 
            type: String, 
            required: true 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [/.+\@.+\..+/, 'Please enter a valid email address']
        },
        password: {
            type: String,
            select: false
        },
        profilePicture: {
            type: String,
            default: ''
        },
        phoneNumber: String,
        role: {
            type: String,
            enum: Object.values(UserRoleEnum),
            default: UserRoleEnum.USER,
        },
        account: {
            type: [{
                type: String,
                enum: Object.values(UserAccountEnum),
            }],
            default: [UserAccountEnum.EMAIL],
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        googleId: String,
        githubId: String,
        isDeactivated: {
            type: Boolean,
            default: false
        },
        deactivateReason: String,
        deactivateTime: Date,
        devices: [
            {
                deviceId: { 
                    type: String, 
                    required: true 
                },
                deviceType: { 
                    type: String, 
                    required: true 
                },
                ipAddress: {
                    type: String, 
                    required: true 
                },
                lastLogin: { 
                    type: Date, 
                    default: Date.now 
                },
                userAgent: { 
                    type: String 
                }
            }
        ],
        billingInfo: {
            phoneNumber: {
                type: String,
                required: true
            },
            address: {
                street: {
                    type: String,
                    required: true
                },
                city: {
                    type: String,
                    required: true
                },
                state: {
                    type: String,
                    required: true
                },
                postalCode: {
                    type: String,
                    required: true
                },
                country: {
                    type: String,
                    required: true
                },
            }
        },
        latestSubsciption: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
        },
        loginAttempt: {
            count: {
                type: Number,
                default: 0,
            },
            lastLogin: {
                type: Date,
                default: Date.now
            },
        },
    },
    {
        timestamps: true,
    }
);

// JWT Token
UserSchema.methods.getJWTToken = function (this: IUser) {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;