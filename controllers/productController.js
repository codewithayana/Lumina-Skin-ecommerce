import { v7 as uuidv7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const createProduct = async (req, res) => {
  console.log("create product route working >>>>>>>>");
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    const data = req.body;

    // Thumbnail (single)
    const thumbnail =
      req.files?.thumbnail?.[0]?.filename || null;

    //Product Images (multiple)
    const productImages =
      req.files?.productImages?.map(file => file.filename) || [];

    const productData = {
      productId: uuidv7(),
      productName: data.name,
      shortDesc: data.shortDesc,
      description: data.description,
      category: data.category,
      brand: data.brand,
      price: Number(data.price),
      discountPrice: Number(data.discountPrice),
      stock: Number(data.stock),
      rating: "",
      thumbnail: thumbnail,           // ✅ fixed
      images: productImages,           // ✅ added
      picturePath: "pictures",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await connectDB();
    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .insertOne(productData);

    console.log("✅ New product added:", result.insertedId);

    return res.redirect("/admin/add-product");
    // or: res.redirect("/admin/products-list");

  } catch (error) {
    console.error("❌ Create product error:", error);
    res.status(500).send("Failed to create product");
  }
};


export const getAllProducts = async () => {
  try {
    const db = await connectDB();
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({})
      .toArray();

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};
