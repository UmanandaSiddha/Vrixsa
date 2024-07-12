import express from "express";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";
import { createPayment, getPaymentById, getPayments } from "../controllers/paymentController.js";

const router = express.Router();

router.route("/create/:id").post(isAuthenticatedUser, isUserVerified, createPayment);
router.route("/all").get(isAuthenticatedUser, isUserVerified, getPayments);
router.route("/:id").get(isAuthenticatedUser, isUserVerified, getPaymentById);

export default router;