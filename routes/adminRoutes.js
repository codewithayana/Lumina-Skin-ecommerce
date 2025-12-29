import { Router } from "express";
import {
  adminLoginPage,
  adminDashboardPage,
  adminAddProductPage,
  adminProductsListPage,
  adminOrdersListPage,
  adminProductEditPage,
} from "../controllers/adminController.js";

import { adminLogin } from "../controllers/adminAuth.js";

import {
  createProduct,
  deleteProduct,
  editProductDetailsPage,
} from "../controllers/productController.js";

import { uploadFiles } from "../middleware/uploadMiddleware.js";

const adminRoutes = Router({ mergeParams: true });

/* ---------------- AUTH ---------------- */
adminRoutes.get("/", adminLoginPage);
adminRoutes.post("/login", adminLogin);

/* ---------------- DASHBOARD ---------------- */
adminRoutes.get("/dashboard", adminDashboardPage);

/* ---------------- PRODUCTS ---------------- */
adminRoutes.get("/add-product", adminAddProductPage);
adminRoutes.get("/products-list", adminProductsListPage);

/* Edit product pages */
adminRoutes.get("/products/edit/:id", adminProductEditPage);
adminRoutes.post("/products/edit/:id", editProductDetailsPage);

/* Create product */
adminRoutes.post(
  "/add-product",
  uploadFiles("userAssets/uploads", "fields", null, null, [
    { name: "thumbnail", maxCount: 1 },
    { name: "productImages", maxCount: 3 },
  ]),
  createProduct
);

/* Delete product */
adminRoutes.get("/products/delete/:id", deleteProduct);

/* ---------------- ORDERS ---------------- */
adminRoutes.get("/orders-list", adminOrdersListPage);

export default adminRoutes;
