import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5005;

app.use(express.json({ limit: "1mb" }));
app.get("/api/review/health", (_req, res) => {
  res.json({ service: "review-service", status: "ok" });
});
app.use("/api/review", reviewRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  let message = error.message;
  if (error.code === 11000) {
    statusCode = 409;
    message = "You have already reviewed this product";
  } else if (error.name === "CastError") {
    statusCode = 400;
  } else if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = "Request body must be valid JSON";
  }
  if (statusCode === 500) message = "Internal server error";
  if (statusCode >= 500) console.error("Review service error:", error.message);
  res.status(statusCode).json({ message });
});

async function startServer() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.PRODUCT_SERVICE_URL) throw new Error("PRODUCT_SERVICE_URL is required");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Review database connected: ${mongoose.connection.host}`);
  app.listen(port, () => console.log(`Review service listening on port ${port}`));
}

startServer().catch((error) => {
  console.error("Could not start review service:", error.message);
  process.exit(1);
});
