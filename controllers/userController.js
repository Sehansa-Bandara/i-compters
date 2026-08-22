import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'


dotenv.config()

export async function createUser(req, res) {

    try {
        const password = req.body.password;
        const passwordhash = bcrypt.hashSync(password, 10);
        const user = new User(
            {
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                password: passwordhash
            }
        );

        await user.save();

        res.json({ message: "User created successfully" });

    } catch (error) {
        console.error("Error creating user:", error);
        return res.json({ message: "Internal server error" });
    }


}
export async function loginUser(req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await User.findOne({ email: email });

        if (user == null) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const isPasswordMatching = bcrypt.compareSync(password, user.password);
        if (isPasswordMatching) {


            const userInfo = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                isEmailVerified: user.isEmailVerified,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked

            }

            const token = jwt.sign(userInfo, "com345#89@");

            res.json({ token: token, isAdmin: user.isAdmin });
        } else {
            res.status(401).json({ message: "Invalid password" });
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getAllUsers(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to view all users" });
    }
    const pageSizeInString = req.params.pageSize || "10" //"3"
    const pageNumberInString = req.params.pageNumber || "1" //"2"

    const pageSize = parseInt(pageSizeInString) //10
    const pageNumber = parseInt(pageNumberInString) //1


    try {

        const totalUserCount = await User.countDocuments();

        const totalPages = Math.ceil(totalUserCount / pageSize)

        const pagesNeededToBeSkipped = pageNumber - 1

        const itemsNeededtoBeSkipped = pagesNeededToBeSkipped * pageSize

        const users = await User.find().skip(itemsNeededtoBeSkipped).limit(pageSize)

        return res.json({ users: users, totalPages: totalPages, currentPage: pageNumber, totalCount: totalUserCount });

    } catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export function isAdmin(req) {
    if (req.user == null) {
        return false;
    }
    if (!req.user.isAdmin) {
        return false;
    }
    return true;
}
