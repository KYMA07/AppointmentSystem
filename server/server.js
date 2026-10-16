import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import {
  getSettings,
  updateSettings,
} from "./controllers/appointmentController.js";
import { protect, adminOnly } from "./middleware/authMiddleware.js";
import "./models/Appointment.js";

const app = express();

/* Behind the host's reverse proxy: use the real client IP (needed for rate limiting) */
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* Brute-force protection: only FAILED attempts count, 10 per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/settings", getSettings); // public
app.put("/api/settings", protect, adminOnly, updateSettings);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON." });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image must be 10 MB or smaller." });
  }
  if (err.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({ message: "Only PNG or JPEG images are allowed." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request too large." });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Server error." });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("WARNING: JWT_SECRET is missing or too short. Use a long random value.");
  if (process.env.NODE_ENV === "production") process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});