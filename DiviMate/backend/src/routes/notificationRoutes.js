import express from "express";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications
router.get("/", authMiddleware, async (req, res) => {
  const notes = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 });
  res.json(notes);
});

// Mark all as read
router.put("/mark-read", authMiddleware, async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id },
    { $set: { isRead: true } }
  );
  res.json({ msg: "All notifications marked as read" });
});

export default router;
