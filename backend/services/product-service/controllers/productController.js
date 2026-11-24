import Product from "../models/Product.js";
import { deleteImages, uploadImages } from "../utils/cloudinary.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNonNegativeNumber(value, field) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw httpError(400, `${field} must be a non-negative number`);
  }
  return number;
}

function productFields(body, { partial = false } = {}) {
  const fields = {};
  const allowed = ["name", "description", "price", "category", "brand", "stock", "isActive"];
  for (const field of allowed) {
    if (body[field] !== undefined) fields[field] = body[field];
  }

  if (!partial) {
    for (const field of ["name", "description", "price", "category"]) {
      if (fields[field] === undefined || fields[field] === "") {
        throw httpError(400, `${field} is required`);
      }
    }
  }

  if (fields.price !== undefined) fields.price = parseNonNegativeNumber(fields.price, "price");
  if (fields.stock !== undefined) fields.stock = parseNonNegativeNumber(fields.stock, "stock");
  if (fields.name !== undefined && typeof fields.name !== "string") {
    throw httpError(400, "name must be a string");
  }
  if (fields.description !== undefined && typeof fields.description !== "string") {
    throw httpError(400, "description must be a string");
  }
  if (fields.category !== undefined && typeof fields.category !== "string") {
    throw httpError(400, "category must be a string");
  }
  return fields;
}

export async function listProducts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { isActive: true };
  const query = String(req.query.q || req.query.search || "").trim();
  if (query) {
    const term = new RegExp(escapeRegExp(query), "i");
    filter.$or = [{ name: term }, { description: term }, { category: term }, { brand: term }];
  }
  if (req.query.category) filter.category = String(req.query.category).trim();
  if (req.query.inStock === "true") filter.stock = { $gt: 0 };

  const minPrice = parseNonNegativeNumber(req.query.minPrice, "minPrice");
  const maxPrice = parseNonNegativeNumber(req.query.maxPrice, "maxPrice");
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw httpError(400, "minPrice cannot be greater than maxPrice");
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name: { name: 1 },
  };
  const sort = sortOptions[req.query.sort] || sortOptions.newest;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);

  return res.json({
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getProduct(req, res) {
  if (!validId(req.params.id)) throw httpError(400, "Product id is invalid");
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw httpError(404, "Product not found");
  return res.json({ product });
}

export async function createProduct(req, res) {
  const fields = productFields(req.body || {});
  const images = await uploadImages(req.files);
  try {
    const product = await Product.create({ ...fields, images });
    return res.status(201).json({ product });
  } catch (error) {
    await deleteImages(images);
    throw error;
  }
}

export async function updateProduct(req, res) {
  if (!validId(req.params.id)) throw httpError(400, "Product id is invalid");
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, "Product not found");

  const fields = productFields(req.body || {}, { partial: true });
  const newImages = await uploadImages(req.files);
  const oldImages = newImages.length > 0 ? product.images : [];
  if (newImages.length > 0) fields.images = newImages;
  Object.assign(product, fields);

  try {
    await product.save();
  } catch (error) {
    await deleteImages(newImages);
    throw error;
  }
  await deleteImages(oldImages);
  return res.json({ product });
}

export async function deleteProduct(req, res) {
  if (!validId(req.params.id)) throw httpError(400, "Product id is invalid");
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw httpError(404, "Product not found");
  await deleteImages(product.images);
  return res.json({ message: "Product deleted" });
}

export async function adjustStock(req, res) {
  if (!validId(req.params.id)) throw httpError(400, "Product id is invalid");
  const { quantity, direction } = req.body || {};
  const amount = parseNonNegativeNumber(quantity, "quantity");
  if (!amount || !Number.isInteger(amount)) {
    throw httpError(400, "quantity must be a positive whole number");
  }
  if (direction !== "increase" && direction !== "decrease") {
    throw httpError(400, "direction must be 'increase' or 'decrease'");
  }

  const update = direction === "increase" ? amount : -amount;
  const filter = { _id: req.params.id, isActive: true };
  if (direction === "decrease") filter.stock = { $gte: amount };
  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { stock: update } },
    { new: true, runValidators: true }
  );
  if (!product) {
    const exists = await Product.exists({ _id: req.params.id, isActive: true });
    if (!exists) throw httpError(404, "Product not found");
    throw httpError(409, "Insufficient stock");
  }
  return res.json({ productId: product.id, stock: product.stock });
}
