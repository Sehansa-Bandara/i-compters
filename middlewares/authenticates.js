import jwt from "jsonwebtoken"
import dotenv from 'dotenv'

dotenv.config()

export default function authenticates(req, res, next) {
    const header = req.header("Authorization")
    
    if (header != null) {
        const token = header.replace("Bearer ", "")

        jwt.verify(token, process.env.JWT_SECRET, 
            (err, decoded) => {
                
                if(decoded==null){
                    res.status(401).json({ message: "Unauthorized" });
                } else {
                    req.user = decoded
                    next()
                }
            })
    } else {
        next()
    }
}