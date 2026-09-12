import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function createOrder(req, res) {

    try {

        if (req.user == null) {
            res.status(401).json({ message: "You need to login to create an order" });
            return
        }

        if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            res.status(400).json({ message: "No items in order" });
            return;
        }

        const diliveryFee = Number(req.body.diliveryFee) || 0;

        const orderData = {
            orderId: "ORD000001",
            email: req.user.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            addressLine1: req.body.addressLine1,
            addressLine2: req.body.addressLine2 || "",
            city: req.body.city,
            postalCode: req.body.postalCode || "00000",
            district: req.body.district || "colombo",
            diliveryFee: diliveryFee,
            phone: req.body.phone,
            secondaryPhone: req.body.secondaryPhone || "",
            customerNotes: req.body.customerNotes || "",
            totalAmount: 0,
            items: []
        }

        //validate firstName and lastName
        if (orderData.firstName == null || orderData.firstName == "") {
            orderData.firstName = req.user.firstName
        }

        if (orderData.lastName == null || orderData.lastName == "") {
            orderData.lastName = req.user.lastName
        }

        //validate items one by one
        for (let i = 0; i < req.body.items.length; i++) {
            console.log(req.body.items[i])
            //productId , quantity

            const product = await Product.findOne({ productId: req.body.items[i].productId })

            if (product == null) {
                res.status(400).json({ message: "Product with productId " + req.body.items[i].productId + " does not exist" });
                return
            }

            if (!product.isAvailable) {
                res.status(400).json({ message: "Product with productId " + req.body.items[i].productId + " is not available" });
                return
            }

            orderData.items.push({
                product: {
                    productId: product.productId,
                    name: product.name,
                    image: (product.images && product.images[0]) ? product.images[0] : "",
                    price: product.price
                },
                qty: req.body.items[i].qty,
            })

            orderData.totalAmount += product.price * req.body.items[i].qty
        }

        orderData.totalAmount += diliveryFee;

        //generate orderId

        const lastOrder = await Order.findOne().sort({ date: -1 })

        if (lastOrder != null) {

            const lastOrderId = lastOrder.orderId //"ORD000026"
            const lastOrderNumberInString = lastOrderId.replace("ORD", "") //"000026"
            const lastOrderNumber = parseInt(lastOrderNumberInString) //26

            const newOrderNumber = lastOrderNumber + 1 //27
            const newOrderNumberInString = newOrderNumber.toString().padStart(6, "0") //"000027"
            orderData.orderId = "ORD" + newOrderNumberInString //"ORD000027"

        }

        //order creation

        const order = new Order(orderData)
        await order.save()


        //update stock of products

        // for(let i=0 ; i<req.body.items.length ; i++){

        //     const product = await Product.updateOne({ productId : req.body.items[i].productId }, { $inc: { stock: -req.body.items[i].qty } })

        // }

        res.json({ message: "Order created successfully", orderId: orderData.orderId });


    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }

}

export async function getOrders(req, res) {

    try {

        if (req.user == null) {
            res.status(401).json({ message: "You need to login to view your orders" });
            return
        }

        const pageSizeInString = req.params.pageSize || "10" //"3"
        const pageNumberInString = req.params.pageNumber || "1" //"2"

        const pageSize = parseInt(pageSizeInString) //10
        const pageNumber = parseInt(pageNumberInString) //1

        if (req.user.isAdmin) {

            const totalOrderCount = await Order.countDocuments();

            const totalPages = Math.ceil(totalOrderCount / pageSize)

            const pagesNeededToBeSkipped = pageNumber - 1

            const itemsNeededtoBeSkipped = pagesNeededToBeSkipped * pageSize

            const orders = await Order.find().sort({ date: -1 }).skip(itemsNeededtoBeSkipped).limit(pageSize)

            return res.json({ orders: orders, totalPages: totalPages, currentPage: pageNumber, totalCount: totalOrderCount });

        } else {

            const totalOrderCount = await Order.countDocuments({ email: req.user.email });

            const totalPages = Math.ceil(totalOrderCount / pageSize)

            const pagesNeededToBeSkipped = pageNumber - 1

            const itemsNeededtoBeSkipped = pagesNeededToBeSkipped * pageSize

            const orders = await Order.find({ email: req.user.email }).sort({ date: -1 }).skip(itemsNeededtoBeSkipped).limit(pageSize)

            return res.json({ orders: orders, totalPages: totalPages, currentPage: pageNumber, totalCount: totalOrderCount });

        }


    } catch (error) {
        console.error("Error getting orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export async function updateOrderStatus(req, res) {

    if (!isAdmin(req)) {
        res.status(403).json({ message: "You are not authorized to update order status" });
        return
    }

    const orderId = req.params.orderId
    const newStatus = req.params.status

    try {

        const order = await Order.findOne({ orderId: orderId })

        if (order == null) {
            res.status(404).json({ message: "Order with orderId " + orderId + " does not exist" });
            return
        }

        await Order.updateOne({ orderId: orderId }, { status: newStatus })

        res.json({ message: "Order status updated successfully" });

    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}