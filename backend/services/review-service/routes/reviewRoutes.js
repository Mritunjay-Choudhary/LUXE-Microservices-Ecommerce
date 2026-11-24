import { Router } from "express";
import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/products/:productId", getProductReviews);
router.post("/", requireAuth, createReview);
router.patch("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);

export default router;
