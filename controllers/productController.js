import Product from "../models/product.js";


import authenticates from "../middlewares/authenticates.js";

function isAdmin(req) {
    return true ;
}
    




export async function createProduct(req, res) {
    try {

        if (isAdmin(req)) {
            const product = new Product(req.body);
            await product.save();
            return res.status(201).json({ message: "Product created successfully" });

        } else {
            return res.status(403).json({ message: "You need to login as an admin to create a product" });
        }
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function getAllProducts(req, res) {
    try {
        
        if (isAdmin(req)) { 
            const products = await Product.find();
            res.json(products);

        } else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);

        }

    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function deleteProduct(req, res) {
    try {
        const productId = req.params.productId;

        if (isAdmin(req)) {
          const deletedProduct = await Product.findOne({ productId: productId })
            
            if (product == null) {

             res.status(404).json({ message: "Product does not exist" });
             return

            }
            await Product.findOneAndDelete({ productId: productId });
            
            return res.json({ message: "Product deleted successfully" });
        } else {
            return res.status(403).json({ message: "You need to login as an admin to delete a product" });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }

}
export async function updateProduct(req, res) {
    try {
        const productId = req.params.productId;
        
        if (isAdmin(req)) {
            const Product = await Product.findOne({ productId: productId })
            
            if (product == null) {
                 res.status(404).json({ message: "Product does not exist" });
                    return
            }
            await Product.findOneAndUpdate({ productId: productId }, req.body)
             return res.json({ message: "Product updated successfully" });
        } else {


            res.status(403).json({ message: "You need to login as an admin to update a product" });
            return
        }
       

    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
export async function getProductById(req, res) {

    try{

        const productId = req.params.productId

        const product = await Product.findOne({ productId : productId })

        if(product == null){
            res.status(404).json({ message: "Product does not exist" });
            return
        }

        if(product.isAvailable){

            res.json(product);

        }else{

            if(isAdmin(req)){

                res.json(product);

            }else{
                res.status(404).json({ message: "Product does not exist" });
                return
            }

        }

    }catch(error){
        console.error("Error fetching product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}