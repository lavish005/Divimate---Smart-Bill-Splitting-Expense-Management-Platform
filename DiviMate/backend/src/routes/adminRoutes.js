import express from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";

const router = express.Router();

// ⚠️ DANGEROUS: use only for dev reset
router.delete("/reset", async (req, res) => {
  try {
    await User.deleteMany({});
    await Group.deleteMany({});
    res.json({ msg: "✅ All users and groups deleted successfully!" });
  } catch (err) {
    res.status(500).json({ msg: "Error during reset", error: err.message });
  }
});

export default router;
