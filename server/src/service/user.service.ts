import { ReasonPhrases, StatusCodes } from "http-status-codes"
import { GraphQLError } from "graphql"
import User, { IUser } from "../models/user.model.js"

export const associateUserWithAttachment = async (user: IUser, attachment: any) => {
    const userAvail = await User.findById(user?._id).lean()
    if (!userAvail) {
        throw new GraphQLError(ReasonPhrases.NOT_FOUND + ' User with id:: ' + user?._id, {
            extensions: {
                code: StatusCodes.NOT_FOUND,
                http: { status: StatusCodes.NOT_FOUND }
            }
        })
    }
}