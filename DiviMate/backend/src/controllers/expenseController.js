// src/controllers/expenseController.js

import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

import {
  sendPaymentReminder,
  schedulePaymentReminder,
} from "../services/notificationService.js";

import { sendNotification } from "../utils/notify.js";

// ======================================================================
// ADD EXPENSE (Splitwise-style + Email + In-App Notifications)
// ======================================================================
export const addExpense = async (req, res) => {
  try {
    const { groupId, title, amount, paidBy } = req.body;

    console.log("➡️ addExpense called with:", { groupId, title, amount, paidBy });

    if (!groupId || !title || !amount || !paidBy) {
      console.log("❌ Missing fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    // 1️⃣ Fetch group & members
    const group = await Group.findById(groupId);
    if (!group) {
      console.log("❌ Group not found");
      return res.status(404).json({ msg: "Group not found" });
    }

    console.log("📦 Loaded group:", group._id);

    const totalMembers = group.members.length;
    console.log("👥 Total group members:", totalMembers);

    const share = amount / totalMembers;

    // 2️⃣ Create participants with balances
    const participants = group.members.map((member) => ({
      userId: member.userId, // 👈 IMPORTANT: use member.userId, not member._id
      share: share,
      balance: member.userId.toString() === paidBy ? 0 : -share,
    }));

    console.log("🧮 Participants computed:", participants);

    // 3️⃣ Save expense
    const expense = await Expense.create({
      group: groupId,
      title,
      amount,
      paidBy,
      participants,
    });

    console.log("💾 Expense saved:", expense._id);

    // 4️⃣ Load payer info (for messages)
    let payer = null;
    try {
      payer = await User.findById(paidBy).select("name email");
      console.log("👤 Payer loaded:", payer?.name);
    } catch (err) {
      console.error("⚠️ Failed to load payer:", err.message);
    }

    // 5️⃣ Notify users who owe money (email + in-app), but NEVER crash if this fails
    for (const p of participants) {
      if (p.balance < 0) {
        const amountOwed = Math.abs(p.balance);

        let user = null;
        try {
          user = await User.findById(p.userId).select("name email");
        } catch (err) {
          console.error("⚠️ Failed to load user for notification:", err.message);
        }

        // 📨 Email reminder (immediate)
        try {
          if (user?.email && payer?.name) {
            await sendPaymentReminder(
              user.email,
              group.name,
              amountOwed,
              payer.name
            );
          }
        } catch (err) {
          console.error("⚠️ Email reminder failed:", err.message);
        }

        // ⏰ Scheduled reminder (e.g. 1 hour later)
        try {
          if (user?.email && payer?.name) {
            schedulePaymentReminder(
              user.email,
              group.name,
              amountOwed,
              payer.name
            );
          }
        } catch (err) {
          console.error("⚠️ Scheduled reminder failed:", err.message);
        }

        // 🔔 In-app notification
        try {
          await sendNotification(
            p.userId,
            `You owe ₹${amountOwed} to ${payer?.name || "your friend"} in "${group.name}".`,
            "expense",
            req.io
          );
        } catch (err) {
          console.error("⚠️ In-app notification failed:", err.message);
        }
      }
    }

    // 6️⃣ Whom-to-Pay summary
    const toPay = participants
      .filter((p) => p.balance < 0)
      .map((p) => ({
        userId: p.userId,
        owes: Math.abs(p.balance),
        to: paidBy,
      }));

    // 7️⃣ Real-time update to group room
    try {
      if (req.io) {
        req.io.to(groupId).emit("expenseAdded", expense);
      }
    } catch (err) {
      console.error("⚠️ Socket emit failed:", err.message);
    }

    // 8️⃣ Response
    return res.status(201).json({
      msg: "Expense added, split done, reminders & notifications triggered",
      expense,
      toPay,
    });
  } catch (error) {
    console.error("❌ Expense error (final):", error);
    return res.status(500).json({ msg: "Server error adding expense" });
  }
};

// ======================================================================
// GET GROUP EXPENSES
// ======================================================================
export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("participants.userId", "name email")
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error("❌ Fetch error:", error.message);
    res.status(500).json({ msg: "Error fetching expenses" });
  }
};

// ======================================================================
// SIMPLE SPLIT (test helper)
// ======================================================================
export const calculateSplit = async (req, res) => {
  try {
    const { amount, splitAmong } = req.body;

    if (!amount || !splitAmong?.length)
      return res.status(400).json({ msg: "Invalid split request" });

    const perPerson = amount / splitAmong.length;

    const splitDetails = splitAmong.map((user) => ({
      user,
      owes: perPerson,
    }));

    res.json({ perPerson, splitDetails });
  } catch (error) {
    console.error("❌ Split error:", error.message);
    res.status(500).json({ msg: "Split error" });
  }
};
