import express from "express";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error("❌ Fetch notifications error:", err.message);
    res.status(500).json({ msg: "Error fetching notifications" });
  }
});

// Mark all as read
router.put("/mark-read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id },
      { $set: { isRead: true } }
    );
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error("❌ Mark-read error:", err.message);
    res.status(500).json({ msg: "Error marking notifications as read" });
  }
});

export default router;
