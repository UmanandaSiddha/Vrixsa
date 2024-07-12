import express from "express";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";
import { deleteNotification, getNotificationById, getNotifications, markNotificationAsRead, updateNotificationSettings } from "../controllers/notificationController.js";

const router = express.Router();

router.route("/all").get(isAuthenticatedUser, isUserVerified, getNotifications);
router.route("/:id")
    .get(isAuthenticatedUser, isUserVerified, getNotificationById)
    .delete(isAuthenticatedUser, isUserVerified, deleteNotification);
router.route("/update/read/:id").get(isAuthenticatedUser, isUserVerified, markNotificationAsRead);
router.route("/update/setting/:id").get(isAuthenticatedUser, isUserVerified, updateNotificationSettings);

export default router;