import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5002;

app.use(express.json({ limit: "1mb" }));
app.get("/api/product/health", (_req, res) => {
  res.json({ service: "product-service", status: "ok" });
});
app.use("/api/product", productRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
  } else if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = "Request body must be valid JSON";
  } else if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "Each image must be 5 MB or smaller";
  } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Upload up to 5 images using the 'images' field";
  }

  if (statusCode >= 500) {
    console.error("Product service error:", error.message);
    message = "Internal server error";
  }
  res.status(statusCode).json({ message });
});

async function startServer() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Product database connected: ${mongoose.connection.host}`);
  app.listen(port, () => console.log(`Product service listening on port ${port}`));
}

startServer().catch((error) => {
  console.error("Could not start product service:", error.message);
  process.exit(1);
});
