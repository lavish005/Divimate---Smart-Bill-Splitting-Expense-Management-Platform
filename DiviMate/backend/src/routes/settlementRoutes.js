// src/routes/settlementRoutes.js

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSettlement,
  getGroupSettlements,
  getMySettlements,
} from "../controllers/settlementController.js";

const router = express.Router();

// create a settlement (Settle Up)
router.post("/create", authMiddleware, createSettlement);

// all settlements for a group
router.get("/group/:groupId", authMiddleware, getGroupSettlements);

// all settlements where I'm payer or receiver
router.get("/my", authMiddleware, getMySettlements);

export default router;
