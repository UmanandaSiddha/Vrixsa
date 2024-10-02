import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import crypto from "crypto";
export const CustomRoleEnum = {
    MODERATOR: "MODERATOR",
    OWNER: "OWNER",
    STUDENT: "STUDENT",
    INSTRUCTOR: "INSTRUCTOR",
};
const CustomRoleSchema = new mongoose.Schema({
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
}, {
    _id: false
});
const DeviceSchema = new mongoose.Schema({
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
}, {
    _id: false
});
export const UserRoleEnum = {
    USER: "USER",
    ADMIN: "ADMIN",
    ORGANIZATION: "ORGANIZATION",
};
const UserSchema = new mongoose.Schema({
    name: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
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
    isOrganization: {
        type: Boolean,
        default: false
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return !this.isOrganization; },
    },
    customRoles: [CustomRoleSchema],
    organizationMembers: [
        {
            memberId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: String,
                enum: Object.values(CustomRoleEnum),
                default: CustomRoleEnum.STUDENT,
            }
        }
    ],
    devices: [DeviceSchema],
    lastLogin: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true,
});
// Password Hash
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
// JWT Token
UserSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};
// Compare Password
UserSchema.methods.comparePassword = async function (enteredPassword) {
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
const User = mongoose.model("User", UserSchema);
export default User;
