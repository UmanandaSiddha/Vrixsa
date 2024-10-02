import { GraphQLError } from "graphql";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User, { IUser } from "../../../models/user.model.js";
import { MutationResolvers } from "../../../generated/graphql.js";

export const userMutations: MutationResolvers = {
    registerUser: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { user } = args;

            const userDetails = await User.findOne({ email: user.email }).lean() as IUser;
            if (userDetails) {
                throw new GraphQLError("User already exits", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const newUserRequestPayload = new User({
                name: {
                    firstName: user.firstName,
                    lastName: user.lastName
                },
                email: user.email,
                password: user.password,
                profilePicture: user.profilePicture,
                phoneNumber: user.phoneNumber,
            });
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
        } catch (error: any) {
            console.log(error)
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    loginUser: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { user } = args;

            const userDetails = await User.findOne({ email: user.email }) as IUser;
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

                name: userDetails.name ? {
                    firstName: userDetails.name.firstName,
                    lastName: userDetails.name.lastName,
                } : null, // Handle case where name is null
                email: userDetails.email,
                // profilePicture: userDetails.profilePicture,
                // phoneNumber: userDetails.phoneNumber,
                role: userDetails.role || null, // Ensure role can be null
                // isVerified: userDetails.isVerified,

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
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
}