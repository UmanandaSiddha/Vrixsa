import express from "express";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";
import { createOrder, getOrderById, getOrders } from "../controllers/orderController.js";

const router = express.Router();

router.route("/create").post(isAuthenticatedUser, isUserVerified, createOrder);
router.route("/all").get(isAuthenticatedUser, isUserVerified, getOrders);
router.route("/:id").get(isAuthenticatedUser, isUserVerified, getOrderById);


export default router;