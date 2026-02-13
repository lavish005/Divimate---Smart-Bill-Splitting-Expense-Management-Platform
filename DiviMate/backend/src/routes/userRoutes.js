import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateDietType,
  uploadAvatar,
  updateProfile,
  updateEmail,
  requestPhoneOtp,
  updatePhone
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUserDashboard, getDashboardChartData } from "../controllers/userDashboardController.js"; // ⭐ NEW
import multer from "multer";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.put("/diet", authMiddleware, updateDietType);
router.put("/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);
router.put("/profile", authMiddleware, updateProfile);
router.put("/email", authMiddleware, updateEmail);
router.post("/phone-otp", authMiddleware, requestPhoneOtp);
router.put("/phone", authMiddleware, updatePhone);

// ⭐ NEW: personal dashboard
router.get("/dashboard", authMiddleware, getUserDashboard);
router.get("/dashboard/chart-data", authMiddleware, getDashboardChartData);

export default router;
