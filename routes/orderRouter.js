import express from "express";
import { createOrder, getOrders, updateOrderStatus } from "../controllers/orderController.js";
import authenticates from "../middlewares/authenticates.js";


const orderRouter = express.Router()
orderRouter.post("/", authenticates, createOrder)
orderRouter.get("/:pageSize/:pageNumber", authenticates, getOrders)
orderRouter.put("/:orderId", authenticates, updateOrderStatus)
orderRouter.put("/:orderId/:status", authenticates, updateOrderStatus)

export default orderRouter