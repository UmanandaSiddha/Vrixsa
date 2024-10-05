import mongoose, { Document, Schema } from "mongoose"

export interface IOrganization extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    organizationId: string;
    organizationName: string;
    organizationType: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new mongoose.Schema(
    {

    },
    {
        timestamps: true,
    }
)

const Organization = mongoose.model<IOrganization>("Organisation", OrganizationSchema);
export default Organization;