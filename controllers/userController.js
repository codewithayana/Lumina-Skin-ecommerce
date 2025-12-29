import jwt from "jsonwebtoken";
import connectDB from "../config/db.js";
import { bannerData } from "../data/index.js";
import { brandData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";

export const landingPage = async (req, res) => {
  console.log("🚀 landingPage function called");
  try {
    const user = req.user || null;

    const [
      featuredProducts,
      latestMen,
      latestWomen,
      latestUnisex,
      newArrivals,
    ] = await Promise.all([
      getProductsData({ sort: "random", limit: 12 }),
      getProductsData({ category: "Men", sort: "latest", limit: 10 }),
      getProductsData({ category: "Women", sort: "latest", limit: 10 }),
      getProductsData({ category: "Unisex", sort: "latest", limit: 10 }),
      getProductsData({ sort: "latest", limit: 15 }),
    ]);

    const getStockStatus = ({ stock }) => {
      if (stock > 20) return `● Available (${stock})`;
      if (stock > 0) return `◐ Hurry up! Only ${stock} left`;
      return `○ Currently unavailable`;
    };

    const withStockStatus = (products = []) =>
      products.map((product) => ({
        ...product,
        stockStatus: getStockStatus(product),
      }));

    // console.log("latestMen>>>>>", latestWomen);

    res.render("user/homePage", {
      title: "Home - Lumina Skin",
      featuredProducts: withStockStatus(featuredProducts),
      latestMen: withStockStatus(latestMen),
      latestWomen: withStockStatus(latestWomen),
      latestUnisex: withStockStatus(latestUnisex),
      newArrivals: withStockStatus(newArrivals),
      bannerData: bannerData,
      brandData: brandData,
      user: user,
    });
  } catch (error) {
    console.error("❌ Landing page error FULL:", error);
    console.error("❌ STACK:", error.stack);
    res.status(500).send("Error loading home page");
  }
};

export const LoginPage = async (req, res) => {
  console.log("🚀 LoginPage function called");
  try {
    res.render("user/loginPage", {
      title: "Login - Lumina Skin",
    });
  } catch (error) {
    // console.error("❌ Login page error:", error);
    e.res.status(500).send("Error loading login page");
  }
};

export const signupPage = async (req, res) => {
  console.log("🚀 signupPage function called");
  try {
    res.render("user/signupPage", {
      title: "Signup - Lumina Skin",
    });
  } catch (error) {
    // console.error("❌ Signup page error:", error);
    e.res.status(500).send("Error loading signup page");
  }
};
