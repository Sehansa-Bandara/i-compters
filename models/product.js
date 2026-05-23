import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
   productId :{
    type: String,
    required: true,
    unique: true
    },
    name: {
        type: String,
        required: true
    },
    altNames:{
        type: [String],
        default: []
    },
    description: {
        type: String,
        required: true
        },
   images:{
    type: [String],
    default: []
   },
price :{
    type: Number,
    required: true
},
labledPrice :{
    type: Number,
    default: 0
},
stock :{
    type: Number,
    default: 0
},
isAvailable :{
    type: Boolean,
    default: true
},
category :{
    type: String,
},
brand :{
    type: String,
},
model :{
    type: String,
},


})
const Product = mongoose.model('Product', productSchema)

export default Product;