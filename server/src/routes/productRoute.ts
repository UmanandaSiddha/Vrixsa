import express from "express";
import { createReview, deleteReview, getAllProducts, getProductById } from "../controllers/productController.js";
import { isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";

const router = express.Router();

router.route("/all").get(getAllProducts);
router.route("/:id")
    .get(getProductById)
    .put(isAuthenticatedUser, isUserVerified, createReview)
    .delete(isAuthenticatedUser, isUserVerified, deleteReview);

export default router;