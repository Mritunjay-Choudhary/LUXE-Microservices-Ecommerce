import bcrypt from "bcrypt";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createTokenPair, hashToken, verifyRefreshToken } from "../utils/token.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendTokenPair(user, res, statusCode = 200) {
  const tokens = createTokenPair(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return res.status(statusCode).json({
    user: user.toJSON(),
    ...tokens,
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw httpError(400, "Name, email, and password are required");
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 80) {
    throw httpError(400, "Name must be between 2 and 80 characters");
  }
  if (!isValidEmail(cleanEmail)) {
    throw httpError(400, "Enter a valid email address");
  }
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, "Password must be between 8 and 128 characters");
  }

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) throw httpError(409, "An account with this email already exists");

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    passwordHash: await bcrypt.hash(password, 12),
    // Public registration always creates a customer. Promote admins directly in MongoDB.
  });

  return sendTokenPair(user, res, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    throw httpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+passwordHash +refreshTokenHash"
  );
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) throw httpError(401, "Email or password is incorrect");
  return sendTokenPair(user, res);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (typeof refreshToken !== "string" || !refreshToken) {
    throw httpError(400, "Refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw httpError(401, "Refresh token is invalid or expired");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw httpError(401, "Refresh token has been revoked or replaced");
  }

  // Saving a new hash rotates the token; the old refresh token stops working.
  return sendTokenPair(user, res);
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+refreshTokenHash");
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }
  return res.json({ message: "Logged out successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, "User not found");
  return res.json({ user });
});
