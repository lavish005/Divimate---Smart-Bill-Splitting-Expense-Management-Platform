import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        type: { type: String, enum: ["Veg", "Non-Veg"] },
        blocked: { type: Boolean, default: false },
        blockedAt: { type: Date, default: null },
        blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.Group || mongoose.model("Group", groupSchema);
