import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";

/**
 * GET /api/users/dashboard
 * Requires auth (req.user is set by authMiddleware)
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("\n📊 [DASHBOARD] Request from user:", req.user.name);
    console.log("🆔 User ID:", userId);
    console.log("⏰ Timestamp:", new Date().toISOString());

    // 1️⃣ Get all expenses where this user is a participant
    const expenses = await Expense.find({
      "participants.userId": userId,
    })
      .populate("group", "name")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });

    // 2️⃣ Get all settlements involving this user
    const settlements = await Settlement.find({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    });

    // Calculate total settled amounts
    let settledByMe = 0;   // settlements where I paid someone (reduces my owe)
    let settledToMe = 0;   // settlements where someone paid me (reduces my getback)

    for (const s of settlements) {
      if (s.from.toString() === userId.toString()) {
        settledByMe += s.amount;
      }
      if (s.to.toString() === userId.toString()) {
        settledToMe += s.amount;
      }
    }

    let totalSpent = 0;      // total amount user has paid as payer
    let rawOwe = 0;          // how much user owes from expenses (before settlements)
    let rawGetBack = 0;      // how much others owe user from expenses (before settlements)

    const transactionHistory = [];

    for (const exp of expenses) {
      // find THIS user's participant record
      const myEntry = exp.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      const myShare = myEntry ? myEntry.share : 0;
      const myBalance = myEntry ? myEntry.balance : 0;

      // if user is the payer, count full expense in "spent"
      if (exp.paidBy && exp.paidBy._id.toString() === userId.toString()) {
        totalSpent += exp.amount;
      }

      if (myBalance < 0) rawOwe += Math.abs(myBalance);
      if (myBalance > 0) rawGetBack += myBalance;

      transactionHistory.push({
        expenseId: exp._id,
        group: exp.group ? exp.group.name : null,
        title: exp.title,
        amount: exp.amount,
        share: myShare,
        balance: myBalance,
        paidBy: exp.paidBy
          ? { id: exp.paidBy._id, name: exp.paidBy.name }
          : null,
        createdAt: exp.createdAt,
      });
    }

    // 3️⃣ Subtract settlements from owe/getback
    const totalOwe = Math.max(0, rawOwe - settledByMe);
    const totalGetBack = Math.max(0, rawGetBack - settledToMe);

    console.log("✅ [DASHBOARD DATA]");
    console.log("💵 Total Spent: ₹", totalSpent);
    console.log("💸 Total Owe: ₹", totalOwe);
    console.log("💰 Total Get Back: ₹", totalGetBack);
    console.log("📝 Transactions:", transactionHistory.length);
    console.log("==========================================\n");

    res.json({
      msg: "Dashboard fetched successfully",
      totals: {
        totalSpent,
        totalOwe,
        totalGetBack,
      },
      transactionHistory,
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error.message);
    res.status(500).json({ msg: "Error fetching dashboard" });
  }
};

/**
 * GET /api/users/dashboard/chart-data
 * Returns weekly (last 7 days) and monthly (last 6 months) with spent / owe / getback
 */
export const getDashboardChartData = async (req, res) => {
  try {
    console.log("\n📊 [CHART DATA] Request from user:", req.user.name);
    console.log("⏰ Timestamp:", new Date().toISOString());
    const userId = req.user.id;
    const now = new Date();

    // ── Helper: compute spent/owe/getback from a set of expenses + settlements ──
    const computeTotals = (expenses, settlements) => {
      let spent = 0, owe = 0, getback = 0;

      for (const exp of expenses) {
        const myEntry = exp.participants.find(
          (p) => p.userId.toString() === userId.toString()
        );
        const myBalance = myEntry ? myEntry.balance : 0;
        const myShare = myEntry ? myEntry.share : 0;

        spent += myShare;
        if (myBalance < 0) owe += Math.abs(myBalance);
        if (myBalance > 0) getback += myBalance;
      }

      // Subtract settlements
      for (const s of settlements) {
        if (s.from.toString() === userId.toString()) owe = Math.max(0, owe - s.amount);
        if (s.to.toString() === userId.toString()) getback = Math.max(0, getback - s.amount);
      }

      return {
        spent: Math.round(spent * 100) / 100,
        owe: Math.round(owe * 100) / 100,
        getback: Math.round(getback * 100) / 100,
      };
    };

    // ── Weekly: last 7 days ──
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyExpenses = await Expense.find({
      "participants.userId": userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const weeklySettlements = await Settlement.find({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
      createdAt: { $gte: sevenDaysAgo },
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);

      const dayExpenses = weeklyExpenses.filter(
        (e) => e.createdAt.toISOString().slice(0, 10) === key
      );
      const daySettlements = weeklySettlements.filter(
        (s) => s.createdAt.toISOString().slice(0, 10) === key
      );
      const totals = computeTotals(dayExpenses, daySettlements);

      weeklyData.push({
        day: dayNames[d.getDay()],
        date: key,
        ...totals,
      });
    }

    // ── Monthly: last 6 months ──
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyExpenses = await Expense.find({
      "participants.userId": userId,
      createdAt: { $gte: sixMonthsAgo },
    });

    const monthlySettlements = await Settlement.find({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
      createdAt: { $gte: sixMonthsAgo },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const mExpenses = monthlyExpenses.filter((e) => {
        const eKey = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
        return eKey === mKey;
      });
      const mSettlements = monthlySettlements.filter((s) => {
        const sKey = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
        return sKey === mKey;
      });
      const totals = computeTotals(mExpenses, mSettlements);

      monthlyData.push({
        month: monthNames[d.getMonth()],
        key: mKey,
        ...totals,
      });
    }

    // ── Summary breakdown for pie chart ──
    const allExpenses = await Expense.find({ "participants.userId": userId });
    const allSettlements = await Settlement.find({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    });
    const summary = computeTotals(allExpenses, allSettlements);
    const summaryData = [
      { name: "Your Spending", value: summary.spent },
      { name: "You Owe", value: summary.owe },
      { name: "You Get Back", value: summary.getback },
    ].filter((d) => d.value > 0);

    res.json({ weeklyData, monthlyData, summaryData });
  } catch (error) {
    console.error("❌ Chart data error:", error.message);
    res.status(500).json({ msg: "Error fetching chart data" });
  }
};
