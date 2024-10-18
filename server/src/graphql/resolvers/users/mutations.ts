import { GraphQLError } from "graphql";
import { v4 as uuidv4 } from 'uuid';
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User, { IUser } from "../../../models/user.model.js";
import { MutationResolvers, UserAccountEnum, UserRoleEnum } from "../../../generated/graphql.js";
import sendToken from "../../../utils/jwtToken.js";

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

            const userDetails = await User.findOne({ email }) as IUser;
            if (userDetails) {
                throw new GraphQLError("User already exits", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const forwarded = context.req.headers['x-forwarded-for'] as string;
            const ip = forwarded ? forwarded.split(',')[0] : context.req.ip;
            const source = context.req.useragent;
            const deviceType = source.isMobile ? 'Mobile' : source.isTablet ? 'Tablet' : source.isDesktop ? 'Desktop' : 'Unknown';

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
                        deviceType,
                        ipAddress: ip,
                        browser: source.browser || 'Unknown',
                        version: source.version || 'Unknown',
                        os: source.os || 'Unknown',
                        platform: source.platform || 'Unknown',
                        lastLogin: Date.now(),
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

            const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(newUserRequestPayload);

            context.res.cookie("accessToken", accessToken, accessTokenOptions);
            context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);

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

            const forwarded = context.req.headers['x-forwarded-for'] as string;
            const ip = forwarded ? forwarded.split(',')[0] : context.req.ip;
            const source = context.req.useragent;
            const deviceType = source.isMobile ? 'Mobile' : source.isTablet ? 'Tablet' : source.isDesktop ? 'Desktop' : 'Unknown';

            const updatedUser = await User.findByIdAndUpdate(
                userDetails._id,
                {
                    $push: {
                        devices: {
                            deviceId: uuidv4(),
                            deviceType,
                            ipAddress: ip,
                            browser: source.browser,
                            version: source.version,
                            os: source.os,
                            platform: source.platform,
                            lastLogin: Date.now(),
                        }
                    },
                },
                { new: true, runValidators: true, useFindAndModify: false }
            ).lean() as IUser;

            const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(userDetails);

            context.res.cookie("accessToken", accessToken, accessTokenOptions);
            context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);
            
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