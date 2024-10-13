import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from 'uuid';
import crypto from "crypto";

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
    googleId?: string;
    githubId?: string;
    isDeactivated: boolean;
    deactivateReason?: string;
    deactivateTime?: Date;
    devices: IDevice[];
    billingInfo?: IBillingInfo;
    latestSubsciption?: mongoose.Schema.Types.ObjectId;
    loginAttempt: {
        count: number;
        lastLogin: Date;
    },
    refreshToken: string;
    oneTimePassword?: string;
    oneTimeExpire?: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    createdAt: Date;
    updatedAt: Date;

    generateAccessToken(): string;
	generateRefreshToken(): string;
    comparePassword(enteredPassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
    getOneTimePassword(): string;
}

const DeviceSchema: Schema<IDevice> = new mongoose.Schema(
    {
        deviceId: { 
            type: String,
            required: true,
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
        }
    },
    {
        _id: false
    }
)

const BillingInfoSchema: Schema<IBillingInfo> = new mongoose.Schema(
    {
        phoneNumber: String,
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        }
    },
    {
        _id: false
    }
)

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
            index: true,
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
        devices: [DeviceSchema],
        billingInfo: BillingInfoSchema,
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
        refreshToken: String,
    },
    {
        timestamps: true,
    }
);

// Password Hash
UserSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Access Token
UserSchema.methods.generateAccessToken = function (this: IUser) {
	const token = jwt.sign(
		{
			id: this._id,
			email: this.email,
            role: this.role,
            // account: this.account,
		},
		process.env.ACCESS_TOKEN_SECRET!, 
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
	);
    return token;
};

// Refresh Token
UserSchema.methods.generateRefreshToken = function (this: IUser) {
	const token = jwt.sign(
		{ id: this._id },
		process.env.REFRESH_TOKEN_SECRET!,
		{ expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
	);
    this.refreshToken = token;
    return token;
};

// Compare Password
UserSchema.methods.comparePassword = async function (this: IUser, enteredPassword: string) {
    let isPasswordMatched;
    if (this.password) {
        isPasswordMatched = await bcrypt.compare(enteredPassword, this.password);
    }
    return isPasswordMatched;
};

// Generating Password Reset Token
UserSchema.methods.getResetPasswordToken = function (this: IUser) {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    return resetToken;
};

// Generating One Time Password
UserSchema.methods.getOneTimePassword = function (this: IUser) {
    const otp = Math.floor(100000 + Math.random() * 900000);

    this.oneTimePassword = crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");

    this.oneTimeExpire = new Date(Date.now() + 15 * 60 * 1000);

    return otp.toString();
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;