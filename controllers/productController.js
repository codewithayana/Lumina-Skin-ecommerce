import { v7 as uuidv7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const createProduct = async (req, res) => {
  console.log("crete product route working>>>>>>>>", req.body);
  try {
    const data = req.body;
    // console.log(data);

    // console.log(req.files); // array of files
    // const pictures = req.files.map(
    //   (file) => `/userAssets/pictures/${file.filename}`
    // );
    // console.log(pictures);

    const productData = {
      productId: uuidv7(),
      name: data.name,
      shortDesc: data.shortDesc,
      description: data.description,
      category: data.category,
      brand: data.brand,
      price: parseInt(data.price),
      discountPrice: parseInt(data.discountPrice),
      stock: parseInt(data.stock),
      rating: "",
      picturePath: "pictures",
      //   picturePath: pictures,
      thumbnail: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // console.log(productData);

    const db = await connectDB();
    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .insertOne(productData);

    console.log("✅ New product added:", result);

    return res.redirect("/admin/add-product");
    // return res.redirect("/admin/products-list");
  } catch (error) {
    console.log(error);
  }
};
