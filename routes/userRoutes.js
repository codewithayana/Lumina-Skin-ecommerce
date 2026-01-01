import express from "express";
import {
  landingPage,
  LoginPage,
  signupPage,
  cartPage,
  addToCart,
  clearCart,
} from "../controllers/userController.js";
import { adminLoginPage } from "../controllers/adminController.js";
import { logIn, logoutUser, signUp } from "../controllers/userAuth.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

userRoutes.get("/login", LoginPage);

userRoutes.get("/signup", signupPage);

userRoutes.post("/create-user", signUp);

userRoutes.post("/login-user", logIn);

userRoutes.get("/logout", logoutUser);

userRoutes.get("/cart", cartPage );

userRoutes.post("/add-to-cart", addToCart );

userRoutes.get("/cart/clear", clearCart);

export default userRoutes;
