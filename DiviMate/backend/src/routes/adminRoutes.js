import express from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Guarded dev reset: requires auth + ADMIN_RESET=true
router.delete("/reset", authMiddleware, async (req, res) => {
  try {
    if (process.env.ADMIN_RESET !== "true") {
      return res.status(403).json({ msg: "Admin reset disabled" });
    }

    await User.deleteMany({});
    await Group.deleteMany({});
    res.json({ msg: "✅ All users and groups deleted successfully!" });
  } catch (err) {
    res.status(500).json({ msg: "Error during reset", error: err.message });
  }
});

export default router;
