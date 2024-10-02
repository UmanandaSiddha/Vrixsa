import { GraphQLError } from "graphql";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User from "../../../models/user.model.js";
export const userResolvers = {
    getUser: async (parent, args, context, info) => {
        try {
            console.log(`
                parent: ${JSON.stringify(parent)},\n 
                args: ${JSON.stringify(args)},\n 
                context: ${JSON.stringify(context)},\n 
                info ${JSON.stringify(info)}\n 
            `);
            if (!args?._id) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }
            const userDetails = await User.findById(args?._id).lean();
            if (!userDetails) {
                throw new GraphQLError("User not found", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
            return {
                ...userDetails,
                _id: userDetails._id.toString(),
                lastLogin: userDetails.lastLogin?.toISOString(),
                createdAt: userDetails?.createdAt?.toISOString(),
                updatedAt: userDetails?.updatedAt?.toISOString(),
                organizationId: userDetails.organizationId ? [userDetails.organizationId.toString()] : [],
                organizationMembers: userDetails.organizationMembers?.map((organizationMember) => ({
                    ...organizationMember,
                    memberId: organizationMember.memberId?.toString()
                })),
                devices: userDetails.devices?.map((device) => ({
                    ...device,
                    lastLogin: device.lastLogin?.toISOString()
                }))
            };
        }
        catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                extensions: {
                    code: StatusCodes.BAD_REQUEST,
                    http: { status: StatusCodes.BAD_REQUEST }
                }
            });
        }
    },
};
