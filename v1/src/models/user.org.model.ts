import mongoose, { Document, Schema } from "mongoose";

export const CustomRoleEnum = {
    MODERATOR: "MODERATOR",
    OWNER: "OWNER",
    STUDENT: "STUDENT",
    INSTRUCTOR: "INSTRUCTOR",
} as const;

export interface IUserOrg extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    orgId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    role: typeof CustomRoleEnum[keyof typeof CustomRoleEnum];
    settings: {
        notifications: boolean;
    }
    createdAt: Date;
    updatedAt: Date;
}

const UserOrgSchema: Schema<IUserOrg> = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Org',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        role: {
            type: String,
            enum: Object.values(CustomRoleEnum),
            default: CustomRoleEnum.STUDENT,
            required: true
        },
        settings: {
            notifications: {
                type: Boolean,
                default: true,
            },
        }
    },
    {
        timestamps: true,
    }
)

const UserOrg = mongoose.model<IUserOrg>("UserOrg", UserOrgSchema);
export default UserOrg;