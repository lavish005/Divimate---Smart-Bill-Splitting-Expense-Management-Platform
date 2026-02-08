import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },

    title: String,
    amount: Number,

    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        share: Number,   // how much is their fair share
        balance: Number, // +ve: others owe them | -ve: they owe
      }
    ],

    category: String,
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
