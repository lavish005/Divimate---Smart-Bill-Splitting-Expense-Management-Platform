import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createGroup, addMember, getMyGroups } from "../controllers/groupController.js";

const router = express.Router();

router.post("/", authMiddleware, createGroup);
router.put("/add-member", authMiddleware, addMember);
router.get("/", authMiddleware, getMyGroups);

export default router;
