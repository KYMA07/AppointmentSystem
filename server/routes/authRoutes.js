import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/password", protect, changePassword);

export default router;