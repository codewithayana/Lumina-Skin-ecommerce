import { getAllProducts } from "./productController.js";

import collection from "../config/collection.js";
import { deleteProduct } from "./productController.js";
import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

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

export const adminProductEditPage = async (req, res) => {
  console.log("adminProductEditPage page function called >>>>>>>>>>");
  try {
    const productId = req.params.id;
    // console.log(productId);
    const db = await connectDB();

    const productArray = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({ _id: new ObjectId(String(productId)) })
      .toArray();

    const [product] = productArray;
    res.render("admin/product-edit", {
      layout: "admin",
      title: "Admin - Edit Product",
      product,
    });
  } catch (error) {
    // console.log("EDIT BODY:", req.body);

    console.error("❌ Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

/*** */
export const updateOrderStatus = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);

    const orderId = req.params.id;
    const newStatus = req.params.status;

    // console.log("🆕 Updating order:", orderId, "➡️", newStatus);

    // Update order status
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    // Redirect back to orders list
    res.redirect("/admin/orders-list");
  } catch (error) {
    // console.error("❌ Error updating order status:", error);
    res.status(500).send("Failed to update order status.");
  }
};

export const adminOrdersListPage = async (req, res) => {
  try {
    const db = await connectDB();

    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const usersCollection = db.collection(collection.USERS_COLLECTION);

    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const ordersWithTotals = await Promise.all(
      orders.map(async (order) => {
        const cartItems = Array.isArray(order.userCart) ? order.userCart : [];

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
    // console.log("orders with totals>>>>>>",ordersWithTotals)

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

export const adminOrderDetailsPage = async (req, res) => {
  // console.log("Admin Order Details route working 🚀");
  try {
    const db = await connectDB();

    const orderId = req.params.id;
    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const productsCollection = db.collection(collection.PRODUCTS_COLLECTION); // ✅ corrected key

    // Fetch the order by ID
    const order = await ordersCollection.findOne({
      _id: new ObjectId(orderId),
    });
    // console.log("???????? order", order)

    if (!order) return res.status(404).send("Order not found");

    // Attach product details for each cart item
    const cartWithProductDetails = await Promise.all(
      order.userCart.map(async (item) => {
        const product = await productsCollection.findOne({
          productId: item.productId,
        });

        //  console.log("console inside loop>>>> ", product);

        return {
          ...item,
          productName: product?.productName,
          brand: product?.brand,
          stock: product?.stock,
          stockStatus: product.stock > 0,
          image: product.thumbnail,
        };
      })
    );
    // console.log("???????? Product", cartWithProductDetails)

    // Calculate total amount
    const totalAmount = cartWithProductDetails.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    console.log("cart with product Details>>>>>", cartWithProductDetails);

    // Render the order details page
    res.render("admin/order-details", {
      layout: "admin",
      title: `Order Details - ${order._id}`,
      order,
      UserCart: cartWithProductDetails,
      totalAmount,
    });
  } catch (error) {
    console.error("Error loading admin order details:", error);
    res.status(500).send("Something went wrong loading order details.");
  }
};

export const usersListPage = async (req, res) => {
  // console.log("Admin UserstList route working 🚀");
  try {
    const db = await connectDB();

    let usersData = await db
      .collection(collection.USERS_COLLECTION)
      .find({})
      .toArray();

    // format createdAt before sending to HBS
    usersData = usersData.map((user) => {
      return {
        ...user,
        createdAtFormatted: new Date(user.createdAt).toLocaleDateString(
          "en-GB"
        ), // dd/mm/yyyy
      };
    });

    // console.log("userData:", usersData);

    res.render("admin/userList", {
      layout: "admin",
      title: "Admin - Users List",
      usersData,
    });
  } catch (error) {
    // console.error("Error fetching user data:", error);
    res.render("admin/userList", {
      layout: "admin",
      title: "Admin - UsersList",
      usersData: [],
    });
  }
};

export const blockUnblockUser = async (req, res) => {
  console.log("Block/Unblock User route working 🚀");
  // console.log(req.params.id);
  // console.log(req.query.status);
  try {
    const db = await connectDB();
    const userId = req.params.id; // user id from params
    const { status } = req.query; // status from query true/false

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const isBlock = status === "true"; // convert query string to boolean

    // Prepare update data (no blockedAt)
    const updateData = {
      isBlocked: isBlock,
      isActive: !isBlock,
      updatedAt: new Date(),
    };

    const result = await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // res.status(200).json({
    //   message: isBlock ? "User blocked successfully" : "User unblocked successfully",
    // });

    res.redirect("/admin/users-list");
  } catch (error) {
    console.error("Block/Unblock User Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
