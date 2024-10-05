import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import crypto from "crypto";

export const CustomRoleEnum = {
    MODERATOR: "MODERATOR",
    OWNER: "OWNER",
    STUDENT: "STUDENT",
    INSTRUCTOR: "INSTRUCTOR",
};

export interface ICustomRole extends Document {
    name: string;
    permissions: string[];
}

export interface IDevice extends Document {
    deviceId: string;
    deviceType: string;
    ipAddress: string;
    lastLogin: Date;
    userAgent: string;
}

export interface IUser extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    // isOrganization: boolean;
    profilePicture: string;
    phoneNumber?: string;
    role: string;
    // organizationId: mongoose.Schema.Types.ObjectId;
    // customRoles: ICustomRole[];
    // organizationMembers: {
    //     memberId: mongoose.Schema.Types.ObjectId;
    //     role: string;
    // }[]
    devices: IDevice[];
    lastLogin: Date;
    isVerified: boolean;
    googleId: string;
    githubId: string;

    // oneTimePassword?: string;
    // oneTimeExpire?: Date;
    // resetPasswordToken?: string;
    // resetPasswordExpire?: Date;

    createdAt: Date;
    updatedAt: Date;

    getJWTToken(): string;
    comparePassword(enteredPassword: string): Promise<boolean>;
    // getResetPasswordToken(): string;
    // getOneTimePassword(): string;
}

const CustomRoleSchema: Schema<ICustomRole> = new mongoose.Schema(
    {
        name: {
            type: String,
            enum: Object.values(CustomRoleEnum),
            default: CustomRoleEnum.STUDENT,
        },
        permissions: [
            { 
                type: String
            }
        ]
    },
    { 
        _id: false
    }
);

const DeviceSchema: Schema<IDevice> = new mongoose.Schema(
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
    },
    { 
        _id: false
    }
);

export const UserRoleEnum = {
    USER: "USER",
    ADMIN: "ADMIN",
    ORGANIZATION: "ORGANIZATION",
};

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
            required: true
        },
        profilePicture: {
            type: String,
            default: ''
        },
        phoneNumber: {
            type: String
        },
        role: {
            type: String,
            enum: Object.values(UserRoleEnum),
            default: UserRoleEnum.USER,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        // isOrganization: {
        //     type: Boolean,
        //     default: false
        // },
        // organizationId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User',
        //     // required: function (this: IUser) { return !this.isOrganization; },
        //     required: false
        // },
        // customRoles: [CustomRoleSchema],
        // organizationMembers: [
        //     {
        //         memberId: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             ref: 'User'
        //         },
        //         role: {
        //             type: String,
        //             enum: Object.values(CustomRoleEnum),
        //             default: CustomRoleEnum.STUDENT,
        //         }
        //     }
        // ],
        googleId: String,
        githubId: String,
        devices: [DeviceSchema],
        lastLogin: {
            type: Date,
            default: Date.now
        },
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

// JWT Token
UserSchema.methods.getJWTToken = function (this: IUser) {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRE,
    });
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
// UserSchema.methods.getResetPasswordToken = function (this: IUser) {
//     const resetToken = crypto.randomBytes(20).toString("hex");

//     this.resetPasswordToken = crypto
//         .createHash("sha256")
//         .update(resetToken)
//         .digest("hex");

//     this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

//     return resetToken;
// };

// Generating One Time Password
// UserSchema.methods.getOneTimePassword = function (this: IUser) {
//     const otp = Math.floor(100000 + Math.random() * 900000);

//     this.oneTimePassword = crypto
//         .createHash("sha256")
//         .update(otp.toString())
//         .digest("hex");

//     this.oneTimeExpire = new Date(Date.now() + 15 * 60 * 1000);

//     return otp.toString();
// };

const User = mongoose.model<IUser>("User", UserSchema);
export default User;