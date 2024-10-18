import { GraphQLError } from "graphql";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { QueryResolvers, UserAccountEnum, UserRoleEnum } from "../../../generated/graphql.js";
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
                role: userDetails.role as UserRoleEnum,
                account: userDetails.account.map((acc: string) => acc as UserAccountEnum),
            }
        } catch (error: any) {
            throw new GraphQLError(ReasonPhrases.BAD_REQUEST, {
                extensions: {
                    code: StatusCodes.BAD_REQUEST,
                    http: { status: StatusCodes.BAD_REQUEST }
                }
            })
        }
    },
}