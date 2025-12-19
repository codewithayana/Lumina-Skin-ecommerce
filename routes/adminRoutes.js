import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
  adminProductsListPage,
  adminOrdersListPage,
  adminProductEditPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import {
  createProduct,
  deleteProduct,
  editProductDetails,
  editProductDetailsPage,
} from "../controllers/productController.js";
import { uploadFiles } from "../middleware/uploadMiddleware.js";

const adminRoutes = Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.get("/products/edit/:id", adminProductEditPage);

adminRoutes.post("/edit-product/:id", editProductDetailsPage);

adminRoutes.post(
  "/add-product",
  uploadFiles("userAssets/uploads", "fields", null, null, [
    { name: "thumbnail", maxCount: 1 },
    { name: "productImages", maxCount: 3 },
  ]),
  createProduct
);

adminRoutes.get("/products-list", adminProductsListPage);

adminRoutes.get("/orders-list", adminOrdersListPage);

adminRoutes.post("/products/delete/:id", deleteProduct);

export default adminRoutes;
