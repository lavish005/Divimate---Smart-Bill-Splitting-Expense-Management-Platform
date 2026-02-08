import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null, // optional: can link to a specific expense or be general
    },

    from: {
      // who paid
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    to: {
      // who received
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: ["manual", "razorpay", "other"],
      default: "manual",
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed", // manual settle is instantly completed
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settlement ||
  mongoose.model("Settlement", settlementSchema);
