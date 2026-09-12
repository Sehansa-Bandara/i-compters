import express from 'express';
import { createUser, loginUser, getAllUsers, updateUserStatus, updateUserRole, getCurrentUser, updateUserProfile, updateUserPassword } from '../controllers/userController.js';
import authenticates from "../middlewares/authenticates.js";
import { sendOTP, resetPassword } from '../controllers/userController.js';
import { googleLogin } from '../controllers/userController.js';



const userRouter = express.Router();

userRouter.get("/me", authenticates, getCurrentUser);

userRouter.post("/", createUser);
userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/:pageSize/:pageNumber", authenticates, getAllUsers);
userRouter.put("/status", authenticates, updateUserStatus);
userRouter.put("/role", authenticates, updateUserRole);
userRouter.put("/update", authenticates, updateUserProfile);
userRouter.put("/password", authenticates, updateUserPassword);
userRouter.post("/google", googleLogin);
userRouter.post("/otp", sendOTP);
userRouter.post("/reset-password", resetPassword);



export default userRouter;