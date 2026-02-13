import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { sendWeeklySummaryEmail } from "../services/notificationService.js";

/**
 * Runs weekly — for every user, compute how much they owe / get back
 * across all groups, then send a summary email.
 */
export const runWeeklyReminders = async () => {
  try {
    const users = await User.find({}, "name email");

    for (const user of users) {
      const groups = await Group.find({ "members.userId": user._id });
      if (!groups.length) continue;

      let totalOwe = 0;
      let totalGetBack = 0;
      const details = [];

      for (const group of groups) {
        const expenses = await Expense.find({ group: group._id });

        let groupOwe = 0;
        let groupGetBack = 0;

        for (const exp of expenses) {
          const participant = exp.participants.find(
            (p) => p.userId.toString() === user._id.toString()
          );
          if (!participant) continue;

          if (participant.balance < 0) {
            groupOwe += Math.abs(participant.balance);
          } else if (participant.balance > 0) {
            groupGetBack += participant.balance;
          }
        }

        if (groupOwe > 0 || groupGetBack > 0) {
          details.push({
            groupName: group.name,
            owe: groupOwe,
            getBack: groupGetBack,
          });
        }

        totalOwe += groupOwe;
        totalGetBack += groupGetBack;
      }

      // Only send email if there's something to report
      if (totalOwe > 0 || totalGetBack > 0) {
        await sendWeeklySummaryEmail(
          user.email,
          user.name,
          totalOwe,
          totalGetBack,
          details
        );
      }
    }

    console.log("✅ Weekly reminders sent successfully");
  } catch (err) {
    console.error("❌ Weekly reminder job error:", err.message);
  }
};
