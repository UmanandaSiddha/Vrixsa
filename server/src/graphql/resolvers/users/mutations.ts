import { GraphQLError } from "graphql";
import { v4 as uuidv4 } from 'uuid';
import crypto from "crypto";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import User, { IUser } from "../../../models/user.model.js";
import { MutationResolvers, UserAccountEnum, UserRoleEnum } from "../../../generated/graphql.js";
import sendToken from "../../../utils/jwtToken.js";
import { addEmailToQueue } from "../../../utils/emailQueue.js";
import { firebaseAdmin } from "../../../config/firebase.admin.js";

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
                role: email === process.env.ADMIN_EMAIL ? UserRoleEnum.Admin : UserRoleEnum.User,
                devices: [
                    {
                        deviceId: uuidv4(),
                        deviceType,
                        ipAddress: ip,
                        browser: source.browser || "Unknown",
                        version: source.version || "Unknown",
                        os: source.os || "Unknown",
                        platform: source.platform || "Unknown",
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

            const otp = user.getOneTimePassword();
            await user.save({ validateBeforeSave: false });

            const message = `Email verification OTP ( valid for 15 minutes ) :- \n\n ${otp} \n\n Please ignore if you didn't requested this email.`;

            try {
                await addEmailToQueue({
                    email: user.email,
                    subject: `Email Veification`,
                    message,
                });
            } catch (error) {
                user.oneTimePassword = undefined;
                user.oneTimeExpire = undefined;
                await user.save({ validateBeforeSave: false });
            }

            const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(userPayload);

            context.res.cookie("accessToken", accessToken, accessTokenOptions);
            context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);

            return {
                ...userPayload.toObject(),
                _id: userPayload._id.toString(),
                role: userPayload.role as UserRoleEnum,
                account: userPayload.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error: any) {
            console.log(error);
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

            if (userDetails.isBlocked) {
                throw new GraphQLError("IAccount is blocked", {
                    extensions: {
                        code: StatusCodes.FORBIDDEN,
                        http: { status: StatusCodes.FORBIDDEN }
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
            console.log(error)
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    verifyUser: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { otp } = args;
            if (!otp) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            const oneTimePassword = crypto
                .createHash("sha256")
                .update(otp.toString())
                .digest("hex");

            const user = await User.findOne({
                _id: context.req.user?._id,
                oneTimePassword,
                oneTimeExpire: { $gt: Date.now() },
            });

            if (!user) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            user.isVerified = true;
            user.oneTimePassword = undefined;
            user.oneTimeExpire = undefined;
        
        
            const savedUser = await user.save();
        
            const message = savedUser
                ? "Account Verified Successfully!!"
                : "Account Verification Failed, Please try again later.";
        
            try {
                await addEmailToQueue({
                    email: user.email,
                    subject: `Account Verification Update`,
                    message,
                });
            } catch (error) {
                console.log((error as Error).message);
            }

            const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(user);

            context.res.cookie("accessToken", accessToken, accessTokenOptions);
            context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);

            return {
                ...user.toObject(),
                _id: user._id.toString(),
                role: user.role as UserRoleEnum,
                account: user.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    resetPassword: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { data } = args;
            const { oldPassword, newPassword, confirmPassword } = data;
            if (!oldPassword || !newPassword || !confirmPassword) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            const userDetails = await User.findById(context.req.user?._id).select('+password') as IUser;
            if (!userDetails) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const isPasswordMatched = await userDetails.comparePassword(oldPassword);

            if (!isPasswordMatched) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
        
            if (newPassword !== confirmPassword) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
        
            userDetails.password = newPassword;
        
            await userDetails.save();

            return {
                ...userDetails.toObject(),
                _id: userDetails._id.toString(),
                role: userDetails.role as UserRoleEnum,
                account: userDetails.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error) {
            console.log(error)
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    setPassword: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { data } = args;
            const { newPassword, confirmPassword } = data;
            if (!newPassword || !confirmPassword) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            if (newPassword !== confirmPassword) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const userDetails = await User.findById(context.req.user?._id).select('+password') as IUser;
            if (!userDetails) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            
            if (userDetails.account.includes(UserAccountEnum.Email)) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            userDetails.password = newPassword;
            userDetails.account = [...userDetails.account, UserAccountEnum.Email];
        
            await userDetails.save();

            return {
                ...userDetails.toObject(),
                _id: userDetails._id.toString(),
                role: userDetails.role as UserRoleEnum,
                account: userDetails.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error) {
            console.log(error)
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    forgotPassword: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { data } = args;
            const { token, userId, newPassword, confirmPassword } = data;
            if (!token || !userId || !newPassword || !confirmPassword) {
                throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                    extensions: {
                        code: StatusCodes.BAD_REQUEST,
                        http: { status: StatusCodes.BAD_REQUEST }
                    }
                });
            }

            if (newPassword !== confirmPassword) {
                throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR + ' User payload not saved', {
                    extensions: {
                        code: StatusCodes.INTERNAL_SERVER_ERROR,
                        http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                    }
                });
            }

            const resetPasswordToken = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");
        
            const user = await User.findOne({
                _id: userId,
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });

            if (!user) {
                throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR + ' User payload not saved', {
                    extensions: {
                        code: StatusCodes.INTERNAL_SERVER_ERROR,
                        http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                    }
                });
            }

            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(user);

            context.res.cookie("accessToken", accessToken, accessTokenOptions);
            context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);

            return {
                ...user.toObject(),
                _id: user._id.toString(),
                role: user.role as UserRoleEnum,
                account: user.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    updateProfile: async (parent: any, args: any, context: any, info: any) => {
        try {
            const userDetails = await User.findById(context.req.user?._id) as IUser;
            if (!userDetails) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const { data } = args;
            const { firstName, lastName, phoneNumber } = data;

            const updatedProfile = {
                firstName: firstName || userDetails.firstName,
                lastName: lastName || userDetails.lastName,
                phoneNumber: phoneNumber || userDetails.phoneNumber,
            };
        
            const updatedUser = await User.findByIdAndUpdate(
                context.req.user?._id,
                updatedProfile,
                { new: true, runValidators: true, useFindAndModify: false }
            );
            if (!updatedUser) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            return {
                ...updatedUser.toObject(),
                _id: updatedUser._id.toString(),
                role: updatedUser.role as UserRoleEnum,
                account: updatedUser.account.map((acc: string) => acc as UserAccountEnum),
            };
        } catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    },
    googleLogin: async (parent: any, args: any, context: any, info: any) => {
        try {
            const { token } = args;
            if (!token) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }

            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            if (!decodedToken) {
                throw new GraphQLError("Invalid Credentails", {
                    extensions: {
                        code: StatusCodes.NOT_FOUND,
                        http: { status: StatusCodes.NOT_FOUND }
                    }
                });
            }
            const { uid, email, name, picture, email_verified } = decodedToken;
            const user = await User.findOne({ email });

            if (user) {
                if (user?.googleId === uid) {
                    const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(user);

                    context.res.cookie("accessToken", accessToken, accessTokenOptions);
                    context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);
                } else {
                    user.googleId = uid;
                    user.account.push(UserAccountEnum.Google);
                    if (user?.profilePicture?.length === 0) {
                        user.profilePicture = picture;
                    }
                    if (email === process.env.ADMIN_EMAIL) {
                        user.role = UserRoleEnum.Admin;
                        await user.save();
                    }
                    await user.save();
                    const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(user);

                    context.res.cookie("accessToken", accessToken, accessTokenOptions);
                    context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);
                }

                return {
                    ...user.toObject(),
                    _id: user._id.toString(),
                    role: user.role as UserRoleEnum,
                    account: user.account.map((acc: string) => acc as UserAccountEnum),
                };
            } else {
                const newUser = await User.create({
                    firstName: name.split(" ")[0],
                    lastName: name.split(" ").slice(1).join(" "),
                    email,
                    avatar: picture,
                    account: [UserAccountEnum.Google],
                    isVerified: email_verified,
                    role: email === process.env.ADMIN_EMAIL? UserRoleEnum.Admin : UserRoleEnum.User,
                    googleId: uid
                });
                const { accessToken, accessTokenOptions, refreshToken, refreshTokenOptions } = await sendToken(newUser);

                context.res.cookie("accessToken", accessToken, accessTokenOptions);
                context.res.cookie("refreshToken", refreshToken, refreshTokenOptions);

                return {
                    ...newUser.toObject(),
                    _id: newUser._id.toString(),
                    role: newUser.role as UserRoleEnum,
                    account: newUser.account.map((acc: string) => acc as UserAccountEnum),
                };
            }
        } catch (error) {
            console.log(error);
            throw new GraphQLError(ReasonPhrases.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: StatusCodes.INTERNAL_SERVER_ERROR,
                    http: { status: StatusCodes.INTERNAL_SERVER_ERROR }
                }
            });
        }
    }
}