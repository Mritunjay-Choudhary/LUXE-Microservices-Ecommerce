import jwt from "jsonwebtoken";

function unauthorized(message = "A valid bearer access token is required") {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

export function requireAuth(req, _res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return next(unauthorized());

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) return next(new Error("JWT_ACCESS_SECRET is required"));

  try {
    const payload = jwt.verify(token, secret);
    if (!payload.sub || (payload.type && payload.type !== "access")) {
      return next(unauthorized("Access token is invalid or expired"));
    }
    req.user = { id: payload.sub, role: payload.role || "customer" };
    return next();
  } catch {
    return next(unauthorized("Access token is invalid or expired"));
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

export function requireInternalService(req, _res, next) {
  const configuredToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (!configuredToken) return next(new Error("INTERNAL_SERVICE_TOKEN is required"));
  if (req.get("x-internal-service-token") !== configuredToken) {
    const error = new Error("Valid internal service credentials are required");
    error.statusCode = 401;
    return next(error);
  }
  return next();
}
