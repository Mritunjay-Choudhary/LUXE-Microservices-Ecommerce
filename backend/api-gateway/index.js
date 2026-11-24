import express from "express";
import "dotenv/config";
import proxy from "express-http-proxy";
import cors from "cors";

const PORT = process.env.PORT || 7000;
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: `api-gateway-${process.env.SERVER}`,
    status: "ok",
  });
});

app.use("/api/auth", proxy("http://auth-service:5001", {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`
}));

app.use("/api/product", proxy("http://product-service:5002", {
  proxyReqPathResolver: (req) => `/api/product${req.url}`
}));

app.use("/api/cart", proxy("http://cart-service:5003", {
  proxyReqPathResolver: (req) => `/api/cart${req.url}`
}));

app.use("/api/order", proxy("http://order-service:5004", {
  proxyReqPathResolver: (req) => `/api/order${req.url}`
}));

app.use("/api/review", proxy("http://review-service:5005", {
  proxyReqPathResolver: (req) => `/api/review${req.url}`
}));
app.listen(PORT, () => {
  console.log(`API-GATEWAY-${process.env.SERVER} is listening on port ${PORT}`);
});