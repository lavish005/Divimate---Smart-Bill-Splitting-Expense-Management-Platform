// src/controllers/settlementController.js

import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/notify.js";

// POST /api/settlements/create
// body: { groupId, to, amount, expenseId? }
export const createSettlement = async (req, res) => {
  try {
    const { groupId, to, amount, expenseId, method } = req.body;
    const from = req.user.id; // logged-in user

    console.log("\n💳 [CREATE SETTLEMENT] Request received");
    console.log("👤 From:", req.user.name);
    console.log("👤 To:", to);
    console.log("💰 Amount: ₹", amount);
    console.log("📋 Method:", method || "manual");
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (!groupId || !to || !amount) {
      return res.status(400).json({ msg: "groupId, to, and amount are required" });
    }

    // 1️⃣ Validate group
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    // 2️⃣ Verify both users are in this group
    const isFromMember = group.members.some(
      (m) => m.userId.toString() === from.toString()
    );
    const isToMember = group.members.some(
      (m) => m.userId.toString() === to.toString()
    );

    if (!isFromMember || !isToMember) {
      return res
        .status(400)
        .json({ msg: "Both payer and receiver must be members of the group" });
    }

    const fromMember = group.members.find(
      (m) => m.userId.toString() === from.toString()
    );
    if (fromMember?.blocked) {
      return res.status(403).json({ msg: "You are blocked in this group" });
    }

    // 3️⃣ Create settlement record
    console.log("💾 Creating settlement record...");
    const settlement = await Settlement.create({
      group: groupId,
      expense: expenseId || null,
      from,
      to,
      amount,
      method: method || "manual",
      status: "completed",
      paidAt: new Date(),
    });

    // 4️⃣ Notify receiver in-app
    try {
      const payer = await User.findById(from).select("name");
      await sendNotification(
        to,
        `${payer?.name || "Someone"} settled ₹${amount} with you in "${group.name}".`,
        "payment",
        req.io
      );
      console.log("🔔 [NOTIFICATION SENT] Settlement notification sent to receiver");
    } catch (err) {
      console.error("⚠️ Notification for settlement failed:", err.message);
    }

    console.log("✅ [SETTLEMENT CREATED] ID:", settlement._id);
    console.log("==========================================\n");

    return res.status(201).json({
      msg: "Settlement recorded successfully",
      settlement,
    });
  } catch (err) {
    console.error("❌ createSettlement error:", err);
    return res.status(500).json({ msg: "Error creating settlement" });
  }
};

// GET /api/settlements/group/:groupId
export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log("\n📋 [GET GROUP SETTLEMENTS] Group:", groupId, "User:", req.user.name);

    const settlements = await Settlement.find({ group: groupId })
      .populate("from", "name email")
      .populate("to", "name email")
      .populate("expense", "title amount")
      .sort({ createdAt: -1 });

    console.log("✅ [SETTLEMENTS FETCHED] Count:", settlements.length);

    return res.json(settlements);
  } catch (err) {
    console.error("❌ getGroupSettlements error:", err.message);
    return res.status(500).json({ msg: "Error fetching group settlements" });
  }
};

// GET /api/settlements/my
export const getMySettlements = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("\n🔍 [GET MY SETTLEMENTS] User:", req.user.name);

    const settlements = await Settlement.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("group", "name")
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    console.log("✅ [MY SETTLEMENTS FETCHED] Count:", settlements.length);

    return res.json(settlements);
  } catch (err) {
    console.error("❌ getMySettlements error:", err.message);
    return res.status(500).json({ msg: "Error fetching your settlements" });
  }
};
