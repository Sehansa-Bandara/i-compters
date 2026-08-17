import Order from "../models/order.js";
import Product from "../models/product.js";



export async function createOrder(req, res) {
    try {
        if (req.user == null) {
            return res.status(401).json({ message: "You need to login to create an order" });
        }

        const orderData = {
            orderId: "ORD000001",
            email: req.user.email,
            firstName: req.body.firstName || req.user.firstName || "",
            lastName: req.body.lastName || req.user.lastName || "",
            addressLine1: req.body.addressLine1 || "",
            addressLine2: req.body.addressLine2 || "",
            city: req.body.city || "",
            postalCode: req.body.postalCode || "",
            district: req.body.district || "colombo",
            diliveryFee: req.body.diliveryFee || 0,
            phone: req.body.phone || req.body.phoneNumber || "",
            secondaryPhone: req.body.secondaryPhone || req.body.secondaryPhoneNumber || "",
            customerNotes: req.body.customerNotes || req.body.specialNotes || "",
            totalAmount: 0,
            items: []
        };

        // Basic fields validations
        if (!orderData.firstName.trim()) {
            return res.status(400).json({ message: "First name is required" });
        }
        if (!orderData.addressLine1.trim()) {
            return res.status(400).json({ message: "Address Line 1 is required" });
        }
        if (!orderData.city.trim()) {
            return res.status(400).json({ message: "City is required" });
        }
        if (!orderData.district.trim()) {
            return res.status(400).json({ message: "District is required" });
        }
        if (!orderData.phone.trim()) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: "Order must contain at least one item" });
        }

        // Validate items one by one
        for (let i = 0; i < req.body.items.length; i++) {
            const item = req.body.items[i];
            //productID,qauntity

            const product = await Product.findOne({ productId: item.product?.productId || item.productId });

            if (product == null) {
                return res.status(400).json({
                    message: "Product with productId " + (item.product?.productId || item.productId) + " does not exist"
                });
            }

            if (!product.isAvailable) {
                return res.status(400).json({
                    message: "Product with productId " + product.productId + " is not available"
                });
            }

            const itemQty = item.qty || 1;
            orderData.items.push({
                product: {
                    productId: product.productId,
                    name: product.name,
                    image: (product.images && product.images[0]) || product.image || "",
                    price: product.price
                },
                qty: itemQty
            });

            orderData.totalAmount += product.price * itemQty;
        }

        // Add delivery fee to total amount
        orderData.totalAmount += orderData.diliveryFee;

        // Generate next orderId
        const lastOrder = await Order.findOne().sort({ date: -1 });
        if (lastOrder != null && lastOrder.orderId) {
            const lastOrderId = lastOrder.orderId; // "ORD000026"
            const lastOrderNumberInString = lastOrderId.replace("ORD", ""); // "000026"
            const lastOrderNumber = parseInt(lastOrderNumberInString, 10); // 26

            if (!isNaN(lastOrderNumber)) {
                const newOrderNumber = lastOrderNumber + 1; // 27
                const newOrderNumberInString = newOrderNumber.toString().padStart(6, "0"); // "000027"
                orderData.orderId = "ORD" + newOrderNumberInString; // "ORD000027"
            }
        }

        const newOrder = new Order(orderData);
        await newOrder.save();

        res.status(201).json({
            message: "Order placed successfully!",
            order: newOrder
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
}

export async function getOrders(req, res) {
    try {
        if (req.user == null) {
            return res.status(401).json({ message: "You nedd to login to view your orders" });
        }
        const pageSizeString = req.params.pageSize || "10"
        const pageNumberInString = req.params.pageNumber || "1"



        let orders;
        if (req.user.isAdmin) {

            const totalOrderVount = await Order.countDocuments();
            const totalpages = Math.ceil(totalOrderCount / pageSize);
            const pagesNeededToBeSkipped = pageNumber - 1
            const itemsNeededToBeSkipped = pagesNeededToBeSkipped * pageSize


            orders = await Order.find().sort({ date: -1 }).skip(itemsNeededToBeSkipped).limit(pageSize)
            return res.json({ orders: orders, totalPages: totalpages, currentPage: pageNumber, totalOrderCount: totalOrderCount, pageSize: pageSize })

        } else {

            const totalOrderVount = await Order.countDocuments({ email: req.user.email });
            const totalpages = Math.ceil(totalOrderCount / pageSize);
            const pagesNeededToBeSkipped = pageNumber - 1
            const itemsNeededToBeSkipped = pagesNeededToBeSkipped * pageSize


            const orders = await Order.find({ email: req.user.email }).sort({ date: -1 }).skip(itemsNeededToBeSkipped).limit(pageSize)

            return res.json({ orders: orders, totalPages: totalpages, currentPage: pageNumber, totalOrderCount: totalOrderCount, pageSize: pageSize })
        }


    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateOrderStatus(req, res) {
    try {
        if (req.user == null || !req.user.isAdmin) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { orderId } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { status: status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
