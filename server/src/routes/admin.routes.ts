import express from "express";
import { authorizeRoles, isAuthenticatedUser, isUserVerified } from "../middlewares/auth.middleware.js";
import { getAllUsers, getUserById, toggleBlockUser, updatedUserRole } from "../controllers/admin.controller.js";
import { UserRoleEnum } from "../models/user.model.js";

const router = express.Router();

router.route("/users/all").get(isAuthenticatedUser, isUserVerified, authorizeRoles(UserRoleEnum.ADMIN), getAllUsers);
router.route("/users/byId/:id").get(isAuthenticatedUser, isUserVerified, authorizeRoles(UserRoleEnum.ADMIN), getUserById);
router.route("/users/edit/block/:id").get(isAuthenticatedUser, isUserVerified, authorizeRoles(UserRoleEnum.ADMIN), toggleBlockUser);
router.route("/users/edit/role/:id").put(isAuthenticatedUser, isUserVerified, authorizeRoles(UserRoleEnum.ADMIN), updatedUserRole);

export default router;