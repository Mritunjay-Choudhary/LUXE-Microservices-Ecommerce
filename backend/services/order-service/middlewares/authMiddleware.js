import jwt from "jsonwebtoken";

export function requireAuth(req, _res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    const error = new Error("A bearer access token is required");
    error.statusCode = 401;
    return next(error);
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) return next(new Error("JWT_ACCESS_SECRET is required"));

  try {
    const payload = jwt.verify(token, secret);
    if (!payload.sub || (payload.type && payload.type !== "access")) {
      const error = new Error("Access token is invalid or expired");
      error.statusCode = 401;
      return next(error);
    }
    req.user = { id: payload.sub, role: payload.role || "customer" };
    return next();
  } catch {
    const error = new Error("Access token is invalid or expired");
    error.statusCode = 401;
    return next(error);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    const error = new Error("Admin role is required");
    error.statusCode = req.user ? 403 : 401;
    return next(error);
  }
  return next();
}
