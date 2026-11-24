import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import Order from "../models/Order.js";
import { adjustProductStock, clearCart, getCart, getProduct } from "../utils/serviceClients.js";
import { getRazorpayClient } from "../utils/razorpay.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function getAccessToken(req) {
  return req.get("authorization").slice("Bearer ".length);
}

function cleanAddress(address) {
  const required = ["name", "phone", "line1", "city", "state", "postalCode"];
  if (!address || typeof address !== "object") {
    throw httpError(400, "shippingAddress is required");
  }
  for (const field of required) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      throw httpError(400, `shippingAddress.${field} is required`);
    }
  }
  return {
    name: address.name.trim(),
    phone: address.phone.trim(),
    line1: address.line1.trim(),
    line2: typeof address.line2 === "string" ? address.line2.trim() : "",
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: typeof address.country === "string" && address.country.trim() ? address.country.trim() : "India",
  };
}

async function restoreReservedStock(items) {
  const failures = [];
  for (const item of items) {
    try {
      await adjustProductStock(item.productId, item.quantity, "increase");
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) {
    throw httpError(503, "Could not release all reserved stock; retry the operation later");
  }
}

export async function createOrder(req, res) {
  const accessToken = getAccessToken(req);
  const shippingAddress = cleanAddress(req.body?.shippingAddress);
  const cartResponse = await getCart(accessToken);
  const cartItems = cartResponse.cart?.items || [];
  if (cartItems.length === 0) throw httpError(400, "Cannot create an order from an empty cart");

  const items = [];
  for (const cartItem of cartItems) {
    if (!isId(cartItem.productId) || !Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
      throw httpError(502, "Cart service returned invalid items");
    }
    const product = await getProduct(cartItem.productId);
    if (product.stock < cartItem.quantity) {
      throw httpError(409, `Insufficient stock for ${product.name}`);
    }
    items.push({
      productId: cartItem.productId,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.url || "",
      quantity: cartItem.quantity,
    });
  }

  const totalAmount = Number(
    items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  );
  const currency = process.env.PAYMENT_CURRENCY || "INR";
  const reservedItems = [];

  try {
    for (const item of items) {
      await adjustProductStock(item.productId, item.quantity, "decrease");
      reservedItems.push(item);
    }
  } catch (error) {
    await restoreReservedStock(reservedItems);
    throw error;
  }

  let order;
  try {
    order = await Order.create({
      userId: req.user.id,
      items,
      shippingAddress,
      totalAmount,
      currency,
    });

    const razorpay = getRazorpayClient();
    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency,
      receipt: `order_${Date.now()}_${randomUUID().slice(0, 8)}`,
    });
    order.razorpayOrderId = paymentOrder.id;
    await order.save();

    try {
      await clearCart(accessToken);
    } catch (error) {
      console.error("Order created but Cart could not be cleared:", error.message);
    }

    return res.status(201).json({
      order,
      payment: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: paymentOrder.id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
      },
    });
  } catch (error) {
    if (order) {
      order.orderStatus = "cancelled";
      order.paymentStatus = "failed";
      await order.save().catch(() => {});
    }
    await restoreReservedStock(reservedItems);
    throw error;
  }
}

export async function listMyOrders(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = req.user.role === "admin" && req.query.all === "true" ? {} : { userId: req.user.id };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  return res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getOrder(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Order id is invalid");
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");
  if (req.user.role !== "admin" && order.userId !== req.user.id) {
    throw httpError(403, "You cannot view this order");
  }
  return res.json({ order });
}

export async function verifyPayment(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Order id is invalid");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value)) {
    throw httpError(400, "Razorpay payment fields are required");
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");
  if (order.userId !== req.user.id) throw httpError(403, "You cannot update this order");
  if (order.paymentStatus === "paid") return res.json({ order, message: "Payment is already verified" });
  if (order.orderStatus !== "pending_payment" || razorpay_order_id !== order.razorpayOrderId) {
    throw httpError(409, "Razorpay order does not match this pending order");
  }

  if (!process.env.RAZORPAY_KEY_SECRET) throw httpError(503, "Razorpay credentials are not configured");
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const suppliedBuffer = Buffer.from(razorpay_signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    throw httpError(400, "Razorpay signature is invalid");
  }

  order.razorpayPaymentId = razorpay_payment_id;
  order.paymentStatus = "paid";
  order.orderStatus = "paid";
  await order.save();
  return res.json({ order, message: "Payment verified" });
}

export async function cancelOrder(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Order id is invalid");
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    throw httpError(403, "You cannot cancel this order");
  }
  if (order.orderStatus !== "pending_payment") {
    throw httpError(409, "Only orders awaiting payment can be cancelled");
  }

  await restoreReservedStock(order.items);
  order.orderStatus = "cancelled";
  order.paymentStatus = "cancelled";
  await order.save();
  return res.json({ order, message: "Order cancelled" });
}

export async function updateOrderStatus(req, res) {
  if (!isId(req.params.id)) throw httpError(400, "Order id is invalid");
  const { status } = req.body || {};
  if (!["processing", "shipped", "delivered"].includes(status)) {
    throw httpError(400, "status must be processing, shipped, or delivered");
  }
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");
  if (order.paymentStatus !== "paid" || order.orderStatus === "cancelled") {
    throw httpError(409, "Only paid orders can move through fulfillment");
  }
  order.orderStatus = status;
  await order.save();
  return res.json({ order });
}
