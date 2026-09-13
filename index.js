import express from 'express'
import mongoose from 'mongoose'
import userRouter from './routes/userRouter.js'
import cors from 'cors'
import orderRouter from './routes/orderRouter.js'
import productRouter from './routes/productRouter.js'
import reviewRouter from './routes/reviewRoutes.js'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'


dotenv.config()

const mongoUri = process.env.MONGO_URI

mongoose.connect(mongoUri).then(
    () => {
        console.log("Connected to MongoDB")
    }
)

const app = express()



app.use(cors({
    origin: "https://i-computers-frontend-rbvd.vercel.app",
    credentials: true
}))

app.use(express.json())



const authenticateUser = function (req, res, next) {
    const header = req.header("Authorization")

    if (header != null) {
        const token = header.replace("Bearer ", "")

        jwt.verify(token, "com345#89@", (err, decoded) => {
            if (err || decoded == null) {
                return res.status(401).json({ message: "Invalid or expired token" })
            } else {
                req.user = decoded
                next()
            }
        })
    } else {
        return res.status(401).json({ message: "Authorization token required" })
    }
}


app.use("/api/users", userRouter)
app.use("/api/user", userRouter)
app.use("/api/products", productRouter)
app.use("/api/orders", orderRouter)
app.use("/api/reviews", reviewRouter)

app.get("/", (req, res) => {
    res.send("Server is running")
})

app.listen(3000,
    () => console.log("Server is running on port 3000"))