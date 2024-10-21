import express from "express";
import { logoutUser, requestForgot, requestVerification, uploadProfilePicture } from "../controllers/user.controller.js";
import { uploadAvatar } from "../middlewares/multer.middlware.js";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/request/forgot").post(requestForgot);
router.route("/logout").get(isAuthenticatedUser, logoutUser);
router.route("/request/verify").get(isAuthenticatedUser, requestVerification);
router.route("/upload/avatar").put(isAuthenticatedUser, isUserVerified, uploadAvatar.single("avatar"), uploadProfilePicture);

export default router;