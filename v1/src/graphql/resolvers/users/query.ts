import { GraphQLError } from "graphql";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { QueryResolvers } from "../../../generated/graphql.js";
import User, { IUser } from "../../../models/user.model.js";

export const userResolvers: QueryResolvers = {
    getUser: async (parent: any, args: any, context: any, info: any) => {
        try {
            if (!args?._id) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                })
            }
            
            const userDetails = await User.findById(args?._id).lean() as IUser;

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
        } catch (error: any) {
            console.log(error)
            throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                extensions: {
                    code: StatusCodes.BAD_REQUEST,
                    http: { status: StatusCodes.BAD_REQUEST }
                }
            })
        }
    },
}