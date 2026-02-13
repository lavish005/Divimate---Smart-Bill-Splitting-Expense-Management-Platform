import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMessages, sendMessage } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:groupId", authMiddleware, getMessages);
router.post("/:groupId", authMiddleware, sendMessage);

export default router;
