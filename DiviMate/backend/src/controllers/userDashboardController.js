import Expense from "../models/Expense.js";

/**
 * GET /api/users/dashboard
 * Requires auth (req.user is set by authMiddleware)
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Get all expenses where this user is a participant
    const expenses = await Expense.find({
      "participants.userId": userId,
    })
      .populate("group", "name")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });

    let totalSpent = 0;      // total amount user has paid as payer
    let totalOwe = 0;        // how much user currently owes (negative balances)
    let totalGetBack = 0;    // how much others owe the user (positive balances)

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

      if (myBalance < 0) totalOwe += Math.abs(myBalance);
      if (myBalance > 0) totalGetBack += myBalance;

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
