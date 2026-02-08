import express from "express";
import multer from "multer";
import { analyzeMenu } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ Correct import
import fs from "fs";

const router = express.Router();

// ✅ Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_")),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({ storage, fileFilter });

// ✅ Protected AI route
router.post("/analyze", authMiddleware, upload.single("menuImage"), analyzeMenu);

export default router;
