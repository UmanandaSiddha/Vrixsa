import mongoose, { Document, Schema } from "mongoose";

export const OrgTypeEnum = {
    INDIVIDUAL: "INDIVIDUAL",
    COMPANY: "COMPANY",
    ORGANIZATION: "ORGANIZATION",
    ACADEMIC_INSTITUTION: "ACADEMIC_INSTITUTION",
    OTHER: "OTHER",
} as const;

export interface IOrg extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    orgId: string;
    orgName: string;
    orgType: typeof OrgTypeEnum[keyof typeof OrgTypeEnum];
    owner: mongoose.Schema.Types.ObjectId;
    stats: {
        students: number;
        instructors: number;
        moderators: number;
        courses: number;
    },
    settings: {
        notifications: boolean;
    }
    createdAt: Date;
    updatedAt: Date;
}

const OrgSchema: Schema<IOrg> = new mongoose.Schema(
    {
        orgId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        orgName: {
            type: String,
            unique: true,
            required: true,
        },
        orgType: {
            type: String,
            enum: Object.values(OrgTypeEnum),
            default: OrgTypeEnum.INDIVIDUAL,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        stats: {
            students: {
                type: Number,
                default: 0,
            },
            instructors: {
                type: Number,
                default: 0,
            },
            moderators: {
                type: Number,
                default: 0,
            },
            courses: {
                type: Number,
                default: 0,
            },
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

const Org = mongoose.model<IOrg>("Org", OrgSchema);
export default Org;