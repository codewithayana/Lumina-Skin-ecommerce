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

export const cartPage = async (req, res) => {
  // console.log(">>>>>>>>>>cartpage");
  try {
    const userId = req.loggedInUser?.id; // FIXED
    // console.log(">>>>userId",userId)
    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });
    if (!user) return res.status(404).send("User not found"); // FIXED
    // console.log(">>>user",user)

    const userCart = user?.cart || [];
    // console.log(">>>>usercart",userCart)

    const subtotal = userCart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/cartPage", {
      title: "Your Cart",
      userCart,
      subtotal,
    });
  } catch (error) {
    res.send("Something went wrong", error);
    console.log(error);
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.body;

    if (!userId) return res.redirect("/login");
    if (!productId) return res.status(400).send("Product ID required");

    const db = await connectDB();

    /* ---------------- FETCH PRODUCT ---------------- */
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ productId });

    if (!product) return res.status(404).send("Product not found");

    const stock = Number(product.stock);
    const price = Number(product.discountPrice ?? product.price);

    /* ---------------- CHECK CART ITEM ---------------- */
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne(
        { userId, "cart.productId": productId },
        { projection: { "cart.$": 1 } }
      );

    const currentQty = user?.cart?.[0]?.quantity || 0;

    if (currentQty + 1 > stock) {
      return res.redirect("/cart?error=out_of_stock");
    }

    /* ---------------- UPDATE CART ---------------- */
    if (currentQty > 0) {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId, "cart.productId": productId },
        {
          $inc: { "cart.$.quantity": 1 },
          $set: {
            "cart.$.total": (currentQty + 1) * price,
          },
        }
      );
    } else {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId },
        {
          $push: {
            cart: {
              productId: product.productId,
              productName: product.productName,
              price,
              quantity: 1,
              total: price,
              image: product.thumbnail || "/img/default.png",
              addedAt: new Date(),
            },
          },
        }
      );
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("Add to cart error:", error);
    res.redirect("/cart");
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB();

    // Clear the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $set: { cart: [] } });

    res.redirect("/cart"); // redirect back to landing page
  } catch (error) {
    // console.log("Error clearing cart:", error);
    res.status(500).send("Something went wrong while clearing the cart");
  }
};
