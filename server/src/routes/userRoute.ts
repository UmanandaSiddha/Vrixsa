import express from "express";
import { 
    forgotPassword,
    getUser,
    loginUser, 
    logoutUser, 
    registerUser, 
    requestForgot, 
    requestVerification,
    resetPassword,
    updateProfile,
    updateSettings,
    verifyUser
} from "../controllers/userController.js";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";
import { uploadAvatar } from "../config/multerConfig.js";

const router = express.Router();

router.route("/register").post(uploadAvatar.single("avatar"), registerUser);
router.route("/login").post(loginUser);
router.route("/request/forgot").post(requestForgot);
router.route("/forgot/password/:token").put(forgotPassword);
router.route("/verify").put(isAuthenticatedUser, verifyUser);
router.route("/me").get(isAuthenticatedUser, getUser);
router.route("/logout").get(isAuthenticatedUser, logoutUser);
router.route("/request/verify").put(isAuthenticatedUser, requestVerification);
router.route("/update/password").put(isAuthenticatedUser, isUserVerified, resetPassword);
router.route("/update/settings").put(isAuthenticatedUser, isUserVerified, updateSettings);
router.route("/update/profile").put(isAuthenticatedUser, isUserVerified, uploadAvatar.single("avatar"), updateProfile);

export default router;