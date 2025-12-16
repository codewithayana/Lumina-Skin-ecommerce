import { getAllProducts } from "./productController.js";

import connectToDatabase from "../config/db.js";
import collection from "../config/collection.js";

export const adminLoginPage = async (req, res) => {
  res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
};

export const adminDashboardPage = async (req, res) => {
  try {
    // Render dashboard
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
    });
  } catch (error) {
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};

export const adminAddProductPage = async (req, res) => {
  console.log("Admin AddProduct route working 🚀");

  try {
    res.render("admin/add-product", {
      layout: "admin",
      title: "Admin - Add Product",
    });
  } catch (error) {
    res.status(500).send("Something went wrong loading the Add Product page.");
  }
};

export const adminProductsListPage = async (req, res) => {
  try {
    const productsData = await getAllProducts();

    console.log("><><><><< Products", productsData);

    res.render("admin/products-list", {
      layout: "admin",
      title: "Product List",
      products: productsData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export const adminOrdersListPage = async (req, res) => {
  try {
    const db = await connectToDatabase(process.env.DATABASE);

    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const usersCollection = db.collection(collection.USERS_COLLECTION);

    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const ordersWithTotals = await Promise.all(
      orders.map(async (order) => {
        const cartItems = Array.isArray(order.cart) ? order.cart : [];

        const cartWithTotal = cartItems.map((item) => ({
          ...item,
          total: item.total || item.price * item.quantity,
        }));

        const totalAmount = cartWithTotal.reduce(
          (acc, item) => acc + item.total,
          0
        );

        let userEmail = "N/A";
        if (order.userId) {
          const user = await usersCollection.findOne({
            userId: order.userId,
          });
          if (user?.email) userEmail = user.email;
        }

        return {
          ...order,
          cart: cartWithTotal,
          totalAmount,
          userEmail,
        };
      })
    );

    res.render("admin/orders-list", {
      layout: "admin",
      title: "Admin - Orders List",
      orders: ordersWithTotals,
    });
  } catch (error) {
    console.error("❌ Admin Orders Error:", error);
    res
      .status(500)
      .send("Something went wrong while loading orders for admin.");
  }
};
