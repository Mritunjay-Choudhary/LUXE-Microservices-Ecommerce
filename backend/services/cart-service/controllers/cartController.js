import Cart from "../models/Cart.js";
import { getProduct } from "../utils/productClient.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isProductId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function readQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    throw httpError(400, "quantity must be a whole number between 1 and 999");
  }
  return quantity;
}

function cartResponse(cart) {
  const items = cart?.items || [];
  return {
    cart: {
      userId: cart?.userId,
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: Number(
        items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
      ),
    },
  };
}

function productToItem(product, productId, quantity) {
  return {
    productId,
    name: product.name,
    price: product.price,
    imageUrl: product.images?.[0]?.url || "",
    quantity,
  };
}

export async function getCart(req, res) {
  const cart = await Cart.findOne({ userId: req.user.id });
  return res.json(cartResponse(cart));
}

export async function addItem(req, res) {
  const { productId } = req.body || {};
  if (!isProductId(productId)) throw httpError(400, "A valid productId is required");
  const quantity = readQuantity((req.body || {}).quantity ?? 1);
  const product = await getProduct(productId);
  if (quantity > product.stock) throw httpError(409, "Requested quantity exceeds available stock");

  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

  const existingItem = cart.items.find((item) => item.productId === productId);
  const nextQuantity = (existingItem?.quantity || 0) + quantity;
  if (nextQuantity > product.stock) throw httpError(409, "Requested quantity exceeds available stock");

  if (existingItem) {
    Object.assign(existingItem, productToItem(product, productId, nextQuantity));
  } else {
    cart.items.push(productToItem(product, productId, quantity));
  }

  await cart.save();
  return res.status(200).json(cartResponse(cart));
}

export async function updateItem(req, res) {
  const { productId } = req.params;
  if (!isProductId(productId)) throw httpError(400, "Product id is invalid");
  const quantity = readQuantity(req.body?.quantity);
  const cart = await Cart.findOne({ userId: req.user.id });
  const item = cart?.items.find((cartItem) => cartItem.productId === productId);
  if (!item) throw httpError(404, "Product is not in this cart");

  const product = await getProduct(productId);
  if (quantity > product.stock) throw httpError(409, "Requested quantity exceeds available stock");
  Object.assign(item, productToItem(product, productId, quantity));
  await cart.save();
  return res.json(cartResponse(cart));
}

export async function removeItem(req, res) {
  const { productId } = req.params;
  if (!isProductId(productId)) throw httpError(400, "Product id is invalid");
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) throw httpError(404, "Cart not found");

  const itemIndex = cart.items.findIndex((item) => item.productId === productId);
  if (itemIndex < 0) throw httpError(404, "Product is not in this cart");
  cart.items.splice(itemIndex, 1);
  await cart.save();
  return res.json(cartResponse(cart));
}

export async function clearCart(req, res) {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return res.json({ message: "Cart cleared", ...cartResponse(cart) });
}
