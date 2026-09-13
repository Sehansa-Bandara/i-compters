import express from "express";
import { createOrder, getOrders, updateOrderStatus, getDashboardStats } from "../controllers/orderController.js";
import authenticates from "../middlewares/authenticates.js";


const orderRouter = express.Router()
orderRouter.post("/", authenticates, createOrder)
orderRouter.get("/overview/stats", authenticates, getDashboardStats)
orderRouter.get("/:pageSize/:pageNumber", authenticates, getOrders)
orderRouter.put("/:orderId", authenticates, updateOrderStatus)
orderRouter.put("/:orderId/:status", authenticates, updateOrderStatus)

export default orderRouter