// src/controllers/expenseController.js

import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

import {
  sendPaymentReminder,
  schedulePaymentReminder,
  sendNewExpenseEmail,
} from "../services/notificationService.js";

import { sendNotification } from "../utils/notify.js";

// ======================================================================
// ADD EXPENSE (Splitwise-style + Email + In-App Notifications)
// ======================================================================
export const addExpense = async (req, res) => {
  try {
    const { groupId, title, amount, paidBy } = req.body;
    const amountNum = Number(amount);

    console.log("\n💰 [ADD EXPENSE] Request received");
    console.log("➡️ Details:", { groupId, title, amount: amountNum, paidBy });
    console.log("👤 Requested by:", req.user.name);
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (!groupId || !title || !amount || !paidBy) {
      console.log("❌ Missing fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ msg: "Amount must be a positive number" });
    }

    // 1️⃣ Fetch group & members
    const group = await Group.findById(groupId);
    if (!group) {
      console.log("❌ Group not found");
      return res.status(404).json({ msg: "Group not found" });
    }

    const requestingMember = group.members.find(
      (m) => m.userId.toString() === req.user.id
    );

    if (requestingMember?.blocked) {
      return res.status(403).json({ msg: "You are blocked in this group" });
    }

    const paidByMember = group.members.find(
      (m) => m.userId.toString() === paidBy.toString()
    );

    if (!paidByMember) {
      return res.status(400).json({ msg: "Payer must be a member of the group" });
    }

    console.log("📦 Loaded group:", group._id);

    const totalMembers = group.members.length;
    console.log("👥 Total group members:", totalMembers);

    const share = amountNum / totalMembers;

    // 2️⃣ Create participants with balances
    const participants = group.members.map((member) => ({
      userId: member.userId, // 👈 IMPORTANT: use member.userId, not member._id
      share: share,
      balance:
        member.userId.toString() === paidBy.toString()
          ? amountNum - share // payer is owed their net contribution
          : -share,
    }));

    console.log("🧮 Participants computed:", participants);

    // 3️⃣ Save expense
    const expense = await Expense.create({
      group: groupId,
      title,
      amount: amountNum,
      paidBy,
      participants,
    });

    console.log("✅ [EXPENSE CREATED] ID:", expense._id);
    console.log("💵 Amount: ₹", amountNum);
    console.log("👥 Split among:", totalMembers, "members");
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
            console.log("📧 [PAYMENT REMINDER] Sent to:", user.name, "(", user.email, ") - Owes: ₹", amountOwed);
          }
        } catch (err) {
          console.error("⚠️ Email reminder failed:", err.message);
        }

        // 🧾 New expense notification email
        try {
          if (user?.email && payer?.name) {
            await sendNewExpenseEmail(
              user.email,
              user.name,
              title,
              amountNum,
              payer.name,
              group.name,
              amountOwed
            );
            console.log("🧾 [EXPENSE EMAIL] Sent to:", user.name, "(", user.email, ")");
          }
        } catch (err) {
          console.error("⚠️ New expense email failed:", err.message);
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

    console.log("\n📊 [GET EXPENSES] Group:", groupId, "User:", req.user.name);

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ msg: "You are not a member of this group" });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("participants.userId", "name email")
      .sort({ createdAt: -1 });

    console.log("✅ [EXPENSES FETCHED] Count:", expenses.length);

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

// ======================================================================
// GROUP CHART DATA – weekly (7 days) + monthly (6 months) + per-member
// ======================================================================
export const getGroupChartData = async (req, res) => {
  try {
    const { groupId } = req.params;
    const now = new Date();

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ msg: "You are not a member of this group" });
    }

    // ── Weekly: last 7 days ──
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyExpenses = await Expense.find({
      group: groupId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      weeklyMap[key] = { day: dayNames[d.getDay()], date: key, amount: 0 };
    }

    for (const exp of weeklyExpenses) {
      const key = exp.createdAt.toISOString().slice(0, 10);
      if (weeklyMap[key]) weeklyMap[key].amount += exp.amount;
    }

    const weeklyData = Object.values(weeklyMap);

    // ── Monthly: last 6 months ──
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyExpenses = await Expense.find({
      group: groupId,
      createdAt: { $gte: sixMonthsAgo },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { month: monthNames[d.getMonth()], key, amount: 0 };
    }

    for (const exp of monthlyExpenses) {
      const d = exp.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) monthlyMap[key].amount += exp.amount;
    }

    const monthlyData = Object.values(monthlyMap);

    // ── Per-member spending ──
    const allGroupExpenses = await Expense.find({ group: groupId }).populate("paidBy", "name");
    const memberMap = {};
    for (const exp of allGroupExpenses) {
      const name = exp.paidBy?.name || "Unknown";
      if (!memberMap[name]) memberMap[name] = 0;
      memberMap[name] += exp.amount;
    }
    const memberData = Object.entries(memberMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    res.json({ weeklyData, monthlyData, memberData });
  } catch (error) {
    console.error("❌ Group chart data error:", error.message);
    res.status(500).json({ msg: "Error fetching group chart data" });
  }
};

// ======================================================================
// GET GROUP BALANCES – Who owes whom (net balances after settlements)
// ======================================================================
import Settlement from "../models/Settlement.js";

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log("\n💰 [GET BALANCES] Group:", groupId, "User:", req.user.name);

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ msg: "You are not a member of this group" });
    }

    // 1️⃣ Get all expenses
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name")
      .populate("participants.userId", "name");

    // 2️⃣ Get all settlements
    const settlements = await Settlement.find({ group: groupId });

    // 3️⃣ Create a map of member IDs to names
    const memberNames = {};
    group.members.forEach((m) => {
      memberNames[m.userId.toString()] = m.name;
    });

    // 4️⃣ Calculate net balances (pairwise debts)
    // balances[debtor][creditor] = amount debtor owes creditor
    const pairwiseDebts = {};

    // Initialize all pairs
    group.members.forEach((m1) => {
      const id1 = m1.userId.toString();
      pairwiseDebts[id1] = {};
      group.members.forEach((m2) => {
        const id2 = m2.userId.toString();
        if (id1 !== id2) {
          pairwiseDebts[id1][id2] = 0;
        }
      });
    });

    // Process expenses - each participant owes the payer their share
    for (const expense of expenses) {
      const payerId = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
      
      for (const p of expense.participants) {
        const participantId = p.userId?._id?.toString() || p.userId?.toString();
        
        if (participantId && payerId && participantId !== payerId) {
          // Each participant owes the payer their share
          if (pairwiseDebts[participantId] && pairwiseDebts[participantId][payerId] !== undefined) {
            pairwiseDebts[participantId][payerId] += p.share;
          }
        }
      }
    }

    // Process settlements - reduce debts
    for (const settlement of settlements) {
      const fromId = settlement.from.toString();
      const toId = settlement.to.toString();
      
      if (pairwiseDebts[fromId] && pairwiseDebts[fromId][toId] !== undefined) {
        pairwiseDebts[fromId][toId] -= settlement.amount;
      }
    }

    // 5️⃣ Simplify debts - net out bidirectional debts
    const simplifiedDebts = [];
    const processed = new Set();

    for (const debtor of Object.keys(pairwiseDebts)) {
      for (const creditor of Object.keys(pairwiseDebts[debtor])) {
        const pairKey = [debtor, creditor].sort().join("-");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const debtorOwes = pairwiseDebts[debtor][creditor] || 0;
        const creditorOwes = pairwiseDebts[creditor]?.[debtor] || 0;
        const netAmount = debtorOwes - creditorOwes;

        if (Math.abs(netAmount) > 0.01) {
          if (netAmount > 0) {
            simplifiedDebts.push({
              from: debtor,
              fromName: memberNames[debtor],
              to: creditor,
              toName: memberNames[creditor],
              amount: Math.round(netAmount * 100) / 100,
            });
          } else {
            simplifiedDebts.push({
              from: creditor,
              fromName: memberNames[creditor],
              to: debtor,
              toName: memberNames[debtor],
              amount: Math.round(Math.abs(netAmount) * 100) / 100,
            });
          }
        }
      }
    }

    // 6️⃣ For current user - what they owe and what they're owed
    const currentUserId = req.user.id;
    const youOwe = simplifiedDebts.filter((d) => d.from === currentUserId);
    const youAreOwed = simplifiedDebts.filter((d) => d.to === currentUserId);

    console.log("✅ [BALANCES CALCULATED]");
    console.log("   You owe:", youOwe.length, "people");
    console.log("   You are owed by:", youAreOwed.length, "people");

    res.json({
      allBalances: simplifiedDebts,
      youOwe,
      youAreOwed,
      memberNames,
    });
  } catch (error) {
    console.error("❌ Get balances error:", error.message);
    res.status(500).json({ msg: "Error calculating balances" });
  }
};
