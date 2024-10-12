import { GraphQLError } from "graphql";
import { v4 as uuidv4 } from 'uuid';
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User, { IUser } from "../../../models/user.model.js";
import { MutationResolvers, UserAccountEnum, UserRoleEnum } from "../../../generated/graphql.js";

export const userMutations: MutationResolvers = {
    registerUser: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { user } = args;
            const { email, password, firstName, lastName, profilePicture, phoneNumber } = user;
            if (!email || !password || !firstName || !lastName) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            const userDetails = await User.findOne({ email }).lean() as IUser;
            if (userDetails) {
                throw new GraphQLError("User already exits", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const newUserRequestPayload = new User({
                firstName,
                lastName,
                email,
                password,
                profilePicture,
                phoneNumber,
                devices: [
                    {
                        deviceId: uuidv4(),
                        deviceType: 'mobile',
                        ipAddress: '192.168.1.1',
                        lastLogin: new Date(), 
                    }
                ]
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
                ...userPayload.toObject(),
                _id: userPayload._id.toString(),
                role: userPayload.role as UserRoleEnum,
                account: userPayload.account.map((acc: string) => acc as UserAccountEnum),
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
            const { email, password } = user;
            if (!email || !password) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            const userDetails = await User.findOne({ email }).select('+password') as IUser;
            if (!userDetails) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const isPasswordMatched = await userDetails.comparePassword(password);

            if (!isPasswordMatched) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userDetails._id,
                {
                    $push: {
                        devices: {
                            deviceId: uuidv4(),
                            deviceType:'mobile',
                            ipAddress: '192.168.1.1',
                            lastLogin: new Date(),
                        }
                    },
                },
                { new: true, runValidators: true, useFindAndModify: false }
            ).lean() as IUser;
            
            return {
                ...updatedUser,
                _id: updatedUser._id.toString(),
                role: updatedUser.role as UserRoleEnum,
                account: updatedUser.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error: any) {
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
}