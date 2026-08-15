import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
    {
        orderId : {
            type : String,
            unique : true,
            required : true
        },
        date : {
            type : Date,
            default : Date.now
        },
        email : {
            type : String,
            required : true
        },
        firstName : {
            type : String,
            required : true
        },
        lastName : {
            type : String,
            required : true
        },
        addressLine1 : {
            type : String,
            required : true
        },
        addressLine2 : {
            type : String,
            default : ""
        },
        city : {
            type : String,
            required : true
        },
        postalCode : {
            type : String,
            required : true
        },
        district : {
            type : String,
            required : true
        },
        diliveryFee : {
            type : Number,
            default : 0
        },
        phone : {
            type : String,
            required : true
        },
        secondaryPhone : {
            type : String,
            default : ""
        },
        customerNotes : {
            type : String,
            default : ""
        },
        status : {
            type : String,
            enum : ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default : "Pending"
        },
        totalAmount : {
            type : Number,
            required : true
        },
        items : [
            {
                product : {
                    productId : {
                        type : String,
                        required : true
                    },
                    name : {
                        type : String,
                        required : true
                    },
                    image : {
                        type : String,
                        required : true
                    },
                    price : {
                        type : Number,
                        required : true
                    }
                },
                qty : {
                    type : Number,
                    required : true
                }
            }
        ]
    }
)

const Order = mongoose.model("Order" , orderSchema)

export default Order