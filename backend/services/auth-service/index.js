import "dotenv/config"
import express from "express"
import mongoose from "mongoose";
import router from "./routes/authRoutes.js";
const app = express();
const port = Number(process.env.PORT) || 5001;

app.use(express.json({ limit: "1mb" }));

app.get("/api/auth/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});
app.use("/api/auth", router);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.code === 11000) {
    statusCode = 409;
    message = "An account with this email already exists";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Request body must be valid JSON";
  }

  if (statusCode >= 500) {
    console.error("Auth service error:", error.message);
    message = "Internal server error";
  }
  res.status(statusCode).json({ message });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  app.listen(port, () => {
    console.log(`Auth service listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Could not start auth service:", error.message);
  process.exit(1);
});
