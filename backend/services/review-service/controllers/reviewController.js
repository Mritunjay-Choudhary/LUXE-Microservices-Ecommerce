import Review from "../models/Review.js";
import { ensureProductExists } from "../utils/productClient.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function validateReviewFields(body, { partial = false } = {}) {
  const fields = {};
  if (!partial || body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw httpError(400, "rating must be a whole number between 1 and 5");
    }
    fields.rating = rating;
  }
  if (!partial || body.comment !== undefined) {
    if (body.comment !== undefined && typeof body.comment !== "string") {
      throw httpError(400, "comment must be a string");
    }
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (comment.length > 2000) throw httpError(400, "comment must be 2000 characters or fewer");
    fields.comment = comment;
  }
  return fields;
}

export async function createReview(req, res) {
  const { productId } = req.body || {};
  if (!isId(productId)) throw httpError(400, "A valid productId is required");
  const fields = validateReviewFields(req.body || {});
  await ensureProductExists(productId);

  const existingReview = await Review.findOne({ productId, userId: req.user.id });
  if (existingReview) throw httpError(409, "You have already reviewed this product");

  const review = await Review.create({
    productId,
    userId: req.user.id,
    ...fields,
  });
  return res.status(201).json({ review });
}

export async function getProductReviews(req, res) {
  const { productId } = req.params;
  if (!isId(productId)) throw httpError(400, "Product id is invalid");
  await ensureProductExists(productId);

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { productId };
  const [reviews, total, summary] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]),
  ]);

  return res.json({
    reviews,
    summary: {
      averageRating: Number((summary[0]?.averageRating || 0).toFixed(2)),
      totalReviews: summary[0]?.totalReviews || 0,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function updateReview(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Review id is invalid");
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found");
  if (review.userId !== req.user.id && req.user.role !== "admin") {
    throw httpError(403, "You cannot update this review");
  }

  const fields = validateReviewFields(req.body || {}, { partial: true });
  if (Object.keys(fields).length === 0) throw httpError(400, "Provide a rating or comment to update");
  Object.assign(review, fields);
  await review.save();
  return res.json({ review });
}

export async function deleteReview(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Review id is invalid");
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found");
  if (review.userId !== req.user.id && req.user.role !== "admin") {
    throw httpError(403, "You cannot delete this review");
  }
  await review.deleteOne();
  return res.json({ message: "Review deleted" });
}
