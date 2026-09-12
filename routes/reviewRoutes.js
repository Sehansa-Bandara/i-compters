import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";

const router = express.Router();

/*
  GET ALL REVIEWS
*/
router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .populate("productId", "name");

        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch reviews",
        });
    }
});


/*
  GET REVIEWS FOR ONE PRODUCT
*/
router.get("/product/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({
            productId: req.params.productId,
        }).sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product reviews",
        });
    }
});


/*
  ADD REVIEW
*/
router.post("/", async (req, res) => {
    try {
        const {
            name,
            email,
            rating,
            comment,
            productId,
        } = req.body;

        if (!name || !rating || !comment) {
            return res.status(400).json({
                message: "Name, rating and comment are required",
            });
        }

        const isValidObjectId = productId && mongoose.Types.ObjectId.isValid(productId);

        const review = new Review({
            name,
            email: email || undefined,
            rating: Number(rating),
            comment,
            productId: isValidObjectId ? productId : undefined,
        });

        const savedReview = await review.save();

        res.status(201).json({
            message: "Review added successfully",
            review: savedReview,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add review",
        });
    }
});


/*
  DELETE REVIEW
*/
router.delete("/:id", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete review",
        });
    }
});

export default router;