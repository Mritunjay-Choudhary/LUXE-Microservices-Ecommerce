import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cartRoutes from "./routes/cartRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5003;

app.use(express.json({ limit: "1mb" }));
app.get("/api/cart/health", (_req, res) => {
  res.json({ service: "cart-service", status: "ok" });
});
app.use("/api/cart", cartRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  let message = error.message;
  if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = "Request body must be valid JSON";
  }
  if (statusCode === 500) message = "Internal server error";
  if (statusCode >= 500) console.error("Cart service error:", error.message);
  res.status(statusCode).json({ message });
});

async function startServer() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.PRODUCT_SERVICE_URL) throw new Error("PRODUCT_SERVICE_URL is required");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Cart database connected: ${mongoose.connection.host}`);
  app.listen(port, () => console.log(`Cart service listening on port ${port}`));
}

startServer().catch((error) => {
  console.error("Could not start cart service:", error.message);
  process.exit(1);
});
