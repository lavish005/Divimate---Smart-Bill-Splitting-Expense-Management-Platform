import express from "express";
import {
  addExpense,
  getGroupExpenses,
  calculateSplit,
} from "../controllers/expenseController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ correct import

const router = express.Router();

// ✅ Use correct middleware name
router.post("/add", authMiddleware, addExpense);
router.get("/group/:groupId", authMiddleware, getGroupExpenses);
router.post("/split", authMiddleware, calculateSplit);

export default router;
