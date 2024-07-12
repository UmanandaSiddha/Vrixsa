import express from "express";
import { authorizeRoles, isAuthenticatedUser, isUserVerified } from "../middlewares/auth.js";
import { getAllUsers, getUserById, updateUserRole } from "../controllers/admin/userController.js";
import { 
    addProductImages, 
    createProduct, 
    deleteAllProductImages, 
    deleteProduct, 
    deleteProductImages, 
    updateProductDetails 
} from "../controllers/admin/productController.js";
import { uploadProductImages } from "../config/multerConfig.js";
import { updatePaymentStatus } from "../controllers/admin/paymentController.js";
import { updateOrderStatus } from "../controllers/admin/orderController.js";

const router = express.Router();

// User Routes
router.route("/user/all").get(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), getAllUsers);
router.route("/user/:id")
    .get(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), getUserById)
    .put(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), updateUserRole);

// Product Routes
router.route("/product/create").post(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), uploadProductImages.any(), createProduct);
router.route("/product/:id")
    .put(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), updateProductDetails)
    .delete(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), deleteProduct);
router.route("/product/images/add/:id")
    .post(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), uploadProductImages.any(), addProductImages)
    .put(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), deleteProductImages)
    .delete(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), deleteAllProductImages);

// Payment Routes
router.route("/payment/:id").put(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), updatePaymentStatus);

// Order Routes
router.route("/order/:id").put(isAuthenticatedUser, isUserVerified, authorizeRoles("admin"), updateOrderStatus);

export default router;