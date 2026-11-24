import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listMyOrders,
  updateOrderStatus,
  verifyPayment,
} from "../controllers/orderController.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", listMyOrders);
router.get("/:id", getOrder);
router.post("/:id/payment/verify", verifyPayment);
router.post("/:id/cancel", cancelOrder);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
