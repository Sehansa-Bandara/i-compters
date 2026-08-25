import express from 'express';
import authenticates from "../middlewares/authenticates.js";
import { createProduct } from '../controllers/productController.js';
import { getAllProducts } from '../controllers/productController.js';
import { deleteProduct } from '../controllers/productController.js';
import { updateProduct } from '../controllers/productController.js';
import { getProductById } from '../controllers/productController.js';
import { searchProducts } from '../controllers/productController.js';



const productRouter = express.Router();

productRouter.post("/", createProduct);

productRouter.get("/", getAllProducts);

productRouter.get("/search/:query", searchProducts);

productRouter.get("/:productId", getProductById);

productRouter.delete("/:productId", deleteProduct);

productRouter.put("/:productId", updateProduct);


export default productRouter
