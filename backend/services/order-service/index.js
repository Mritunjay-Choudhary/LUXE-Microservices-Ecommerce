import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5004;

app.use(express.json({ limit: "1mb" }));

app.get("/api/order/health", (_req, res) => {
  res.json({ service: "order-service", status: "ok" });
});
app.use("/api/order", orderRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  let message = error.message;
  if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = "Request body must be valid JSON";
  }
  if (statusCode === 500) message = "Internal server error";
  if (statusCode >= 500) console.error("Order service error:", error.message);
  res.status(statusCode).json({ message });
});

async function startServer() {
  for (const variable of ["MONGODB_URI", "CART_SERVICE_URL", "PRODUCT_SERVICE_URL", "INTERNAL_SERVICE_TOKEN"]) {
    if (!process.env[variable]) throw new Error(`${variable} is required`);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Order database connected: ${mongoose.connection.host}`);
  app.listen(port, () => console.log(`Order service listening on port ${port}`));
}

startServer().catch((error) => {
  console.error("Could not start order service:", error.message);
  process.exit(1);
});
