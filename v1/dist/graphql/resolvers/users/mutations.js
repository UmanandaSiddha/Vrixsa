import { GraphQLError } from "graphql";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User from "../../../models/user.model.js";
export const userMutations = {
    registerUser: async (parent, args, context, info) => {
        try {
            console.log(`
                parent: ${JSON.stringify(parent)},\n 
                args: ${JSON.stringify(args)},\n 
                context: ${context},\n 
                info: ${JSON.stringify(info)}\n
            `);
            const { user } = args;
            const userDetails = await User.findOne({ email: user.email }).lean();
            if (userDetails) {
                throw new GraphQLError("User already exits", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
            const newUserRequestPayload = new User(user);
            const userPayload = await newUserRequestPayload.save();
            if (!userPayload) {
                throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR + ' User payload not saved', {
                    extensions: {
                        code: StatusCodes.INTERNAL_SERVER_ERROR,
                        http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                    }
                });
            }
            return {
                ...userPayload,
                _id: userPayload._id.toString(),
                lastLogin: userPayload.lastLogin?.toISOString(),
                createdAt: userPayload?.createdAt?.toISOString(),
                updatedAt: userPayload?.updatedAt?.toISOString(),
                organizationId: userPayload.organizationId ? [userPayload.organizationId.toString()] : [],
                organizationMembers: userPayload.organizationMembers?.map((organizationMember) => ({
                    ...organizationMember,
                    memberId: organizationMember.memberId?.toString()
                })),
                devices: userPayload.devices?.map((device) => ({
                    ...device,
                    lastLogin: device.lastLogin?.toISOString()
                }))
            };
        }
        catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    loginUser: async (parent, args, context, info) => {
        try {
            console.log(`
                parent: ${JSON.stringify(parent)},\n 
                args: ${JSON.stringify(args)},\n 
                context: ${context},\n 
                info: ${JSON.stringify(info)}\n
            `);
            const { user } = args;
            const userDetails = await User.findOne({ email: user.email }).lean();
            if (!userDetails) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
            const isPasswordMatched = await userDetails.comparePassword(user.password);
            if (!isPasswordMatched) {
                throw new GraphQLError("Invalid Credentails", {
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
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
};
