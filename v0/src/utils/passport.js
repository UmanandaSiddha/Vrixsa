import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User, UserLoginType } from "../models/user.model.js";
import { Strategy as GitHubStrategy } from "passport-github2";

try {
    passport.serializeUser((user, next) => {
        next(null, user._id);
    });

    passport.deserializeUser(async (id, next) => {
        try {
            const user = await User.findById(id);
            if (user) next(null, user);
            else next(new ApiError(404, "User does not exist"), null);
        } catch (error) {
            next(
                new ApiError(
                    500,
                    "Something went wrong while deserializing the user. Error: " + error
                ),
                null
            );
        }
    });

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (_, __, profile, next) => {
                const user = await User.findOne({ email: profile._json.email });
                if (user) {
                    if (user.loginType !== UserLoginType.GOOGLE) {
                        next(
                            new ApiError(
                                400,
                                "You have previously registered using " +
                                user.loginType?.toLowerCase()?.split("_").join(" ") +
                                ". Please use the " +
                                user.loginType?.toLowerCase()?.split("_").join(" ") +
                                " login option to access your account."
                            ),
                            null
                        );
                    } else {
                        next(null, user);
                    }
                } else {
                    const createdUser = await User.create({
                        email: profile._json.email,
                        password: profile._json.sub,
                        username: profile._json.email?.split("@")[0],
                        isEmailVerified: true,
                        role: UserRolesEnum.USER,
                        avatar: {
                            url: profile._json.picture,
                            localPath: "",
                        },
                        loginType: UserLoginType.GOOGLE,
                    });
                    if (createdUser) {
                        next(null, createdUser);
                    } else {
                        next(new ApiError(500, "Error while registering the user"), null);
                    }
                }
            }
        )
    );

    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
            },
            async (_, __, profile, next) => {
                const user = await User.findOne({ email: profile._json.email });
                if (user) {
                    if (user.loginType !== UserLoginType.GITHUB) {
                        // TODO: We can redirect user to appropriate frontend urls which will show users what went wrong instead of sending response from the backend
                        next(
                            new ApiError(
                                400,
                                "You have previously registered using " +
                                user.loginType?.toLowerCase()?.split("_").join(" ") +
                                ". Please use the " +
                                user.loginType?.toLowerCase()?.split("_").join(" ") +
                                " login option to access your account."
                            ),
                            null
                        );
                    } else {
                        next(null, user);
                    }
                } else {
                    if (!profile._json.email) {
                        next(
                            new ApiError(
                                400,
                                "User does not have a public email associated with their account. Please try another login method"
                            ),
                            null
                        );
                    } else {
                        const userNameExist = await User.findOne({
                            username: profile?.username,
                        });

                        const createdUser = await User.create({
                            email: profile._json.email,
                            password: profile._json.node_id,
                            username: userNameExist
                                ?
                                profile._json.email?.split("@")[0]
                                : profile?.username,
                            isEmailVerified: true,
                            role: UserRolesEnum.USER,
                            avatar: {
                                url: profile._json.avatar_url,
                                localPath: "",
                            },
                            loginType: UserLoginType.GITHUB,
                        });
                        if (createdUser) {
                            next(null, createdUser);
                        } else {
                            next(new ApiError(500, "Error while registering the user"), null);
                        }
                    }
                }
            }
        )
    );
} catch (error) {
    console.error("PASSPORT ERROR: ", error);
}