import { Router } from "express";
import multer from "multer";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import {
  requireAdmin,
  requireAuth,
  requireInternalService,
} from "../middlewares/authMiddleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(_req, file, callback) {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error("Only JPEG, PNG, and WebP images are allowed");
    error.statusCode = 400;
    return callback(error);
  },
});

router.get("/", listProducts);
router.patch("/internal/:id/stock", requireInternalService, adjustStock);
router.get("/:id", getProduct);
router.post("/", requireAuth, requireAdmin, upload.array("images", 5), createProduct);
router.patch("/:id", requireAuth, requireAdmin, upload.array("images", 5), updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
