import express from 'express';
import { createUser, loginUser, getAllUsers, updateUserStatus, updateUserRole, getCurrentUser, updateUserProfile, updateUserPassword } from '../controllers/userController.js';
import authenticates from "../middlewares/authenticates.js";


const userRouter = express.Router();

userRouter.get("/me", authenticates, getCurrentUser);

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/:pageSize/:pageNumber", authenticates, getAllUsers);
userRouter.put("/status", authenticates, updateUserStatus);
userRouter.put("/role", authenticates, updateUserRole);
userRouter.put("/update", updateUserProfile);
userRouter.put("password", updateUserPassword);


export default userRouter;