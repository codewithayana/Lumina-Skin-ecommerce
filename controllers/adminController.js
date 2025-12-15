import { getAllProducts } from "./productController.js";

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
