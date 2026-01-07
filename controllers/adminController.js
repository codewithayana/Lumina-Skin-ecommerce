import { getAllProducts } from "./productController.js";
import { deleteProduct } from "./productController.js";
import { getCurrentYearSalesByCategory } from "./chartController.js";
import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const adminLoginPage = async (req, res) => {
  res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
};

export const adminDashboardPage = async (req, res) => {
  try {
    const db = await connectDB();

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Start of current year
    const startOfYear = new Date(currentYear, 0, 1);

    // Start and end of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const usersCollection = db.collection(collection.USERS_COLLECTION);

    // 1. Delivered Orders THIS YEAR
    const deliveredOrdersThisYear = await ordersCollection.countDocuments({
      status: "Delivered",
      createdAt: { $gte: startOfYear },
    });

    console.log(">>>>>>deliveredOrdersThisYear",deliveredOrdersThisYear)

    // 2. Products Sold THIS YEAR (sum of all quantities in delivered orders)
    const productsSoldPipeline = [
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: startOfYear },
        },
      },
      { $unwind: "$userCart" },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$userCart.quantity" },
        },
      },
    ];

    const productsSoldResult = await ordersCollection
      .aggregate(productsSoldPipeline)
      .toArray();

    const productsSoldThisYear =
      productsSoldResult.length > 0 ? productsSoldResult[0].totalQuantity : 0;

    console.log("xxxxxxxxx product sold this yeser",productsSoldThisYear)

    // 3. Total Users who placed orders THIS YEAR
    const usersWithOrdersThisYear = await ordersCollection.distinct("userId", {
      createdAt: { $gte: startOfYear },
    });

    const totalUsersThisYear = usersWithOrdersThisYear.length;

    // 4. Total Revenue THIS YEAR
    const revenueThisYearPipeline = [
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: startOfYear },
        },
      },
      { $unwind: "$userCart" },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: ["$userCart.price", "$userCart.quantity"],
            },
          },
        },
      },
    ];

    const revenueThisYearResult = await ordersCollection
      .aggregate(revenueThisYearPipeline)
      .toArray();

    const totalRevenueThisYear =
      revenueThisYearResult.length > 0
        ? revenueThisYearResult[0].totalRevenue
        : 0;

    //5. Last Year Sales by Category (Men/Women)
    const lastYearSales = await getCurrentYearSalesByCategory();

    // console.log(lastYearSales);

    // 6️⃣ Donut Chart Data: Order Status Counts (This Month)
    const statusData = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lte: now } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const donutLabels = statusData.map((item) => item._id);
    const donutData = statusData.map((item) => item.count);
    // console.log("Donut Chart Data:", { donutLabels, donutData });
    // Render dashboard with statistics

    console.log("✅❌✅❌",deliveredOrdersThisYear,
        productsSoldThisYear,
        totalUsersThisYear,)

    // Render dashboard
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
      stats: {
        deliveredOrdersThisYear,
        productsSoldThisYear,
        totalUsersThisYear,
        totalRevenueThisYear: totalRevenueThisYear.toFixed(2),
      },
      menData: JSON.stringify(lastYearSales.menData),
      womenData: JSON.stringify(lastYearSales.womenData),
      unisexData: JSON.stringify(lastYearSales.unisexData),
      donutLabels: JSON.stringify(donutLabels),
      donutData: JSON.stringify(donutData),
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
    console.log("Dashboard error:", error);
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
  // console.log("adminProductEditPage page function called >>>>>>>>>>");
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

    // console.log("cart with product Details>>>>>", cartWithProductDetails);

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
  // console.log("Block/Unblock User route working 🚀");
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
