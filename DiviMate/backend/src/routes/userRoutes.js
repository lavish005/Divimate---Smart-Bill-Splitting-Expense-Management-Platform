import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateDietType
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUserDashboard } from "../controllers/userDashboardController.js"; // ⭐ NEW

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.put("/diet", authMiddleware, updateDietType);

// ⭐ NEW: personal dashboard
router.get("/dashboard", authMiddleware, getUserDashboard);

export default router;
