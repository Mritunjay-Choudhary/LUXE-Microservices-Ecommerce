import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    const error = new Error("A bearer access token is required");
    error.statusCode = 401;
    throw error;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role || "customer" };
    next();
  } catch {
    const error = new Error("Access token is invalid or expired");
    error.statusCode = 401;
    throw error;
  }
});

export function requireRole(...roles) {
  return function checkRole(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("You do not have permission to do this");
      error.statusCode = req.user ? 403 : 401;
      return next(error);
    }
    return next();
  };
}
