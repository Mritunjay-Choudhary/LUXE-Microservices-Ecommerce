import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
}

function refreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is required");
  }
  return process.env.JWT_REFRESH_SECRET;
}

export function createAccessToken(userId, role) {
  return jwt.sign({ sub: String(userId), role, type: "access" }, accessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

export function createRefreshToken(userId) {
  return jwt.sign({ sub: String(userId), type: "refresh" }, refreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function createTokenPair(user) {
  const userId = user._id.toString();
  return {
    accessToken: createAccessToken(userId, user.role),
    refreshToken: createRefreshToken(userId),
  };
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, accessSecret());
  if (!payload.sub || (payload.type && payload.type !== "access")) {
    throw new Error("Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret());
  if (!payload.sub || payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload;
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
