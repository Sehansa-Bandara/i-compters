import User from "../models/user.js";
import Order from "../models/order.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
import transporter from "../utils/emailTransporter.js";
import OTP from "../models/otp.js";
import axios from "axios";




dotenv.config()

export async function createUser(req, res) {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const firstName = (req.body.firstName || req.body.firstname || "").trim();
        const lastName = (req.body.lastName || req.body.lastname || "").trim();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser != null) {
            return res.status(400).json({ message: "This email is already registered. Please log in instead." });
        }

        const passwordhash = bcrypt.hashSync(password, 10);
        const user = new User({
            email: email,
            firstName: firstName || "User",
            lastName: lastName || "",
            password: passwordhash,
            image: "/userGirl.jpg"
        });

        await user.save();

        const userInfo = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            isEmailVerified: user.isEmailVerified,
            isAdmin: user.isAdmin,
            isBlocked: user.isBlocked
        };

        const jwtSecret = process.env.JWT_SECRET || "com345#89@";
        const token = jwt.sign(userInfo, jwtSecret);

        res.status(201).json({
            message: "User registered successfully",
            token: token,
            isAdmin: user.isAdmin,
            user: userInfo
        });

    } catch (error) {
        console.error("Error creating user:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "This email is already registered. Please log in instead." });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function loginUser(req, res) {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email });

        if (user == null) {
            res.status(404).json({ message: "User not found with this email" });
            return;
        }

        if (user.isBlocked) {
            res.status(403).json({ message: "Your account is blocked. Please contact support." });
            return;
        }

        const isPasswordMatching = bcrypt.compareSync(password, user.password);
        if (isPasswordMatching) {
            const userInfo = {
                email: user.email,
                firstName: user.firstName || (user.email ? user.email.split("@")[0] : "User"),
                lastName: user.lastName || "",
                image: user.image,
                isEmailVerified: user.isEmailVerified,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked
            };

            const jwtSecret = process.env.JWT_SECRET || "com345#89@";
            const token = jwt.sign(userInfo, jwtSecret);

            res.json({ token: token, isAdmin: user.isAdmin, user: userInfo });
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
    const pageSizeInString = req.params.pageSize || "10"
    const pageNumberInString = req.params.pageNumber || "1"

    const pageSize = parseInt(pageSizeInString) || 10
    const pageNumber = parseInt(pageNumberInString) || 1

    try {
        let filter = {};
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), "i");
            filter = {
                $or: [
                    { email: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex }
                ]
            };
        }

        const totalUserCount = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUserCount / pageSize) || 1;
        const pagesNeededToBeSkipped = pageNumber - 1;
        const itemsNeededtoBeSkipped = pagesNeededToBeSkipped * pageSize;

        const users = await User.find(filter, { password: 0 })
            .sort({ _id: -1 })
            .skip(itemsNeededtoBeSkipped)
            .limit(pageSize);

        const userEmails = users.map(u => (u.email || "").toLowerCase());
        const orderCounts = await Order.aggregate([
            { $match: { email: { $in: userEmails } } },
            { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 }, totalSpent: { $sum: "$totalAmount" } } }
        ]);
        const orderMap = {};
        orderCounts.forEach(o => { orderMap[o._id] = o; });

        const usersWithOrderCount = users.map(u => {
            const obj = u.toObject ? u.toObject() : { ...u._doc };
            const stats = orderMap[(u.email || "").toLowerCase()] || { count: 0, totalSpent: 0 };
            obj.orderCount = stats.count;
            obj.totalSpent = stats.totalSpent;
            return obj;
        });

        return res.json({
            users: usersWithOrderCount,
            totalPages: totalPages,
            currentPage: pageNumber,
            totalCount: totalUserCount
        });

    } catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function updateUserStatus(req, res) {

    if (!isAdmin(req)) {
        res.status(403).json({ message: "You are not authorized to update user status" });
        return
    }

    const email = req.body.email;
    const isBlocked = req.body.isBlocked;

    try {

        if (email == req.user.email) {
            res.status(400).json({ message: "You cannot update your own status" });
            return
        }


        const user = await User.findOne({ email: email })

        if (user == null) {
            res.status(404).json({ message: "User does not exist" });
            return
        }

        await User.findOneAndUpdate({ email: email }, { isBlocked: isBlocked })

        res.json({ message: "User status updated successfully" });

    } catch (error) {
        console.error("Error updating user status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export async function updateUserRole(req, res) {

    if (!isAdmin(req)) {
        res.status(403).json({ message: "You are not authorized to update user role" });
        return
    }

    const email = req.body.email;
    const isAdminRole = req.body.isAdmin;

    try {

        if (email == req.user.email) {
            res.status(400).json({ message: "You cannot update your own role" });
            return
        }


        const user = await User.findOne({ email: email })

        if (user == null) {
            res.status(404).json({ message: "User does not exist" });
            return
        }

        await User.findOneAndUpdate({ email: email }, { isAdmin: isAdminRole })

        res.json({ message: "User role updated successfully" });

    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}
export async function updateUserProfile(req, res) {

    if (req.user == null) {
        res.status(401).json({ message: "You are not logged in" });
        return
    }

    try {

        const user = await User.findOne({ email: req.user.email })

        if (user == null) {
            res.status(404).json({ message: "User does not exist" });
            return
        }

        await User.findOneAndUpdate({ email: req.user.email }, {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            image: req.body.image
        })

        res.json({ message: "User profile updated successfully" });

    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function updateUserPassword(req, res) {

    if (req.user == null) {
        res.status(401).json({ message: "You are not logged in" });
        return
    }

    try {

        const user = await User.findOne({ email: req.user.email })

        if (user == null) {
            res.status(404).json({ message: "User does not exist" });
            return
        }

        const hashedPassword = bcrypt.hashSync(req.body.password, 10);

        await User.findOneAndUpdate({ email: req.user.email }, {
            password: hashedPassword
        })

        res.json({ message: "User profile updated successfully" });

    } catch (error) {
        console.error("Error updating user profile:", error);
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
export async function getCurrentUser(req, res) {

    if (req.user == null) {
        res.status(401).json({ message: "You are not logged in" });
        return
    }

    try {

        const user = await User.findOne({ email: req.user.email })

        if (user == null) {
            res.status(404).json({ message: "User does not exist" });
            return
        }

        res.json({ user: user });

    } catch (error) {
        console.error("Error getting current user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}
export async function sendOTP(req, res) {
    try {

        const email = req.body.email;

        const user = await User.findOne({ email: email })

        if (user == null) {
            res.status(404).json({ message: "Account not found" });
            return
        }

        if (user.isBlocked) {
            res.status(403).json({ message: "User is blocked" });
            return
        }

        await OTP.findOneAndDelete({ email: email })

        //100000 - 999999

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpHash = bcrypt.hashSync(otp, 10);

        const newOTP = new OTP({
            email: email,
            otp: otpHash
        })

        await newOTP.save();

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: "Your OTP for iComputers",
            text: `Your OTP for iComputers is: ${otp}. It is valid for 5 minutes.`
        }

        transporter.sendMail(message, (error, info) => {
            if (error) {
                console.error("Error sending OTP email:", error);
                return res.status(500).json({ message: "Failed to send OTP email" });
            } else {
                console.log("OTP email sent:", info.response);
                return res.json({ message: "OTP sent successfully" });
            }
        })

    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export async function resetPassword(req, res) {

    const email = req.body.email;
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;

    try {

        const otpRecord = await OTP.findOne({ email: email })

        if (otpRecord == null) {
            res.status(404).json({ message: "OTP not found" });
            return
        }

        const isOTPValid = bcrypt.compareSync(otp, otpRecord.otp);

        const currentTime = new Date();

        const otpCreationTime = new Date(otpRecord.time);

        const timeDifferenceInMinutes = (currentTime - otpCreationTime) / (1000 * 60);

        if (!isOTPValid) {
            res.status(400).json({ message: "Invalid OTP" });
            return
        }

        if (timeDifferenceInMinutes > 5) {
            res.status(400).json({ message: "OTP has expired" });
            return
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        await User.findOneAndUpdate({ email: email }, {
            password: hashedPassword
        })

        await OTP.findOneAndDelete({ email: email })

        res.json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}
export async function googleLogin(req, res) {
    const accessToken = req.body.accessToken;
    if (!accessToken) {
        return res.status(400).json({ message: "Access token is required" });
    }

    try {
        const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!googleResponse.data || !googleResponse.data.email) {
            return res.status(400).json({ message: "Failed to retrieve user info from Google" });
        }

        let user = await User.findOne({ email: googleResponse.data.email });

        if (user == null) {
            const firstName = googleResponse.data.given_name || googleResponse.data.name?.split(" ")[0] || "User";
            const lastName = googleResponse.data.family_name || (googleResponse.data.name ? googleResponse.data.name.replace(firstName, "").trim() : "") || "User";
            const image = googleResponse.data.picture || "/images/default-profile.png";
            const isEmailVerified = Boolean(googleResponse.data.email_verified ?? googleResponse.data.verified_email ?? true);

            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcrypt.hashSync(randomPassword, 10);

            const newUser = new User({
                email: googleResponse.data.email,
                firstName: firstName,
                lastName: lastName,
                image: image,
                password: hashedPassword,
                isEmailVerified: isEmailVerified
            });

            user = await newUser.save();
        } else {
            if (googleResponse.data.picture && user.image !== googleResponse.data.picture) {
                user.image = googleResponse.data.picture;
                await User.findOneAndUpdate({ email: user.email }, { image: googleResponse.data.picture });
            }
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "User is blocked" });
        }

        const userInfo = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            isEmailVerified: user.isEmailVerified,
            isAdmin: user.isAdmin,
            isBlocked: user.isBlocked
        };

        const jwtSecret = process.env.JWT_SECRET || "com345#89@";
        const token = jwt.sign(userInfo, jwtSecret);

        return res.json({ token: token, isAdmin: user.isAdmin, user: userInfo });

    } catch (error) {
        console.error("Error logging in with google:", error);
        return res.status(500).json({ message: "Failed to login with google", error: error.message });
    }
}