import express from "express";
import {
  addExpense,
  getGroupExpenses,
  calculateSplit,
  getGroupChartData,
  getGroupBalances,
} from "../controllers/expenseController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ correct import

const router = express.Router();

// ✅ Use correct middleware name
router.post("/add", authMiddleware, addExpense);
router.get("/group/:groupId", authMiddleware, getGroupExpenses);
router.post("/split", authMiddleware, calculateSplit);
router.get("/group/:groupId/chart-data", authMiddleware, getGroupChartData);
router.get("/group/:groupId/balances", authMiddleware, getGroupBalances);

export default router;
