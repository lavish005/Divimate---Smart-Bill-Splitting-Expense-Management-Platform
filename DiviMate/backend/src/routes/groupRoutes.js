import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
	createGroup,
	addMember,
	getMyGroups,
	inviteMemberByEmail,
	searchUserByEmail,
	blockMember,
	unblockMember
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/", authMiddleware, createGroup);
router.put("/add-member", authMiddleware, addMember);
router.put("/block-member", authMiddleware, blockMember);
router.put("/unblock-member", authMiddleware, unblockMember);
router.post("/invite", authMiddleware, inviteMemberByEmail);
router.get("/search-user", authMiddleware, searchUserByEmail);
router.get("/", authMiddleware, getMyGroups);

export default router;
