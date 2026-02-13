import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dietType: {
      type: String,
      enum: ["Veg", "Non-Veg"],
      default: "Veg"
    },
    avatar: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    phoneOtpHash: {
      type: String,
      default: ""
    },
    phoneOtpExpiresAt: {
      type: Date,
      default: null
    },
    dob: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: ""
    },
    addressLine1: {
      type: String,
      default: ""
    },
    addressLine2: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    postalCode: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
