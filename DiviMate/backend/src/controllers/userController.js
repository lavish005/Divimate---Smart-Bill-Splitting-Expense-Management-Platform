import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPhoneOtpEmail } from "../services/notificationService.js";

// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, dietType } = req.body;
    console.log("\n🆕 [USER REGISTRATION] Attempt started");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🥗 Diet Type:", dietType || "Veg (default)");
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (!name || !email || !password) {
      console.log("❌ [REGISTRATION FAILED] Missing required fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ [REGISTRATION FAILED] Email already exists:", email);
      return res.status(400).json({ msg: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      dietType: dietType || "Veg" // 👈 default if not provided
    });

    const safeUser = await User.findById(newUser._id).select("-password");

    console.log("✅ [REGISTRATION SUCCESS] New user created");
    console.log("🆔 User ID:", newUser._id);
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("==========================================\n");

    res.status(201).json({
      msg: "User registered successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("\n🔐 [USER LOGIN] Attempt started");
    console.log("📧 Email:", email);
    console.log("⏰ Timestamp:", new Date().toISOString());

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ [LOGIN FAILED] User not found:", email);
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ [LOGIN FAILED] Invalid password for:", email);
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const safeUser = await User.findById(user._id).select("-password");

    console.log("✅ [LOGIN SUCCESS] User logged in");
    console.log("🆔 User ID:", user._id);
    console.log("📧 Email:", email);
    console.log("👤 Name:", user.name);
    console.log("🔑 Token generated (expires in 7d)");
    console.log("==========================================\n");

    res.json({
      msg: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ msg: "Server error during login" });
  }
};

// ✅ Get profile (Protected)
export const getProfile = async (req, res) => {
  try {
    console.log("\n👤 [GET PROFILE] Request from user:", req.user.id);
    const user = await User.findById(req.user.id).select("-password");
    console.log("✅ Profile fetched for:", user.name);
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching profile" });
  }
};


// ✅ Upload avatar (Protected)
export const uploadAvatar = async (req, res) => {
  try {
    console.log("\n📷 [AVATAR UPLOAD] User:", req.user.id);
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ msg: "Image file is required" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    console.log("✅ [AVATAR UPLOADED] File:", req.file.filename);
    console.log("👤 User:", updatedUser.name);

    res.json({ msg: "Avatar updated", user: updatedUser });
  } catch (error) {
    console.error("❌ Avatar upload error:", error.message);
    res.status(500).json({ msg: "Error uploading avatar" });
  }
};

// ✅ Update diet type (Protected)
export const updateDietType = async (req, res) => {
  try {
    const { dietType } = req.body;
    console.log("\n🥗 [UPDATE DIET TYPE] User:", req.user.id, "New diet:", dietType);

    if (!["Veg", "Non-Veg"].includes(dietType)) {
      return res.status(400).json({ msg: "Invalid diet type. Must be 'Veg' or 'Non-Veg'." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { dietType },
      { new: true }
    ).select("-password");

    console.log("✅ Diet type updated to:", dietType, "for user:", updatedUser.name);

    res.json({
      msg: "Diet type updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Error updating diet type:", error.message);
    res.status(500).json({ msg: "Server error while updating diet type" });
  }
};

// ✅ Update profile details (Protected)
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      dob,
      gender,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    console.log("\n✏️ [UPDATE PROFILE] User:", req.user.id);
    console.log("📝 Updates:", { name, dob, gender, city, state, country });

    const updates = {
      name,
      dob,
      gender,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    console.log("✅ [PROFILE UPDATED] Successfully updated for:", updatedUser.name);

    res.json({ msg: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("❌ Error updating profile:", error.message);
    res.status(500).json({ msg: "Server error while updating profile" });
  }
};

// ✅ Update email (Protected, requires current password)
export const updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    console.log("\n📧 [UPDATE EMAIL] User:", req.user.id);
    console.log("📧 New email requested:", newEmail);

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ msg: "New email and current password are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Current password is incorrect" });

    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ msg: "Email already in use" });

    user.email = newEmail;
    await user.save();

    console.log("✅ [EMAIL UPDATED] Successfully changed to:", newEmail);

    const safeUser = await User.findById(user._id).select("-password");
    res.json({ msg: "Email updated successfully", user: safeUser });
  } catch (error) {
    console.error("❌ Error updating email:", error.message);
    res.status(500).json({ msg: "Server error while updating email" });
  }
};

// ✅ Send phone OTP to email (Protected)
export const requestPhoneOtp = async (req, res) => {
  try {
    console.log("\n📱 [PHONE OTP REQUEST] User:", req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    user.phoneOtpHash = otpHash;
    user.phoneOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPhoneOtpEmail(user.email, otp);

    console.log("✅ [OTP SENT] To email:", user.email);

    res.json({ msg: "OTP sent to your email" });
  } catch (error) {
    console.error("❌ Error sending phone OTP:", error.message);
    res.status(500).json({ msg: "Server error while sending OTP" });
  }
};

// ✅ Update phone with OTP (Protected)
export const updatePhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log("\n📱 [UPDATE PHONE] User:", req.user.id);
    console.log("📱 New phone:", phone);

    if (!phone || !otp) {
      return res.status(400).json({ msg: "Phone and OTP are required" });
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ msg: "Invalid phone format" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.phoneOtpHash || !user.phoneOtpExpiresAt) {
      return res.status(400).json({ msg: "OTP not requested" });
    }

    if (user.phoneOtpExpiresAt < new Date()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.phoneOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    user.phone = phone;
    user.phoneVerified = true;
    user.phoneOtpHash = "";
    user.phoneOtpExpiresAt = null;
    await user.save();

    console.log("✅ [PHONE UPDATED] New phone verified:", phone);

    const safeUser = await User.findById(user._id).select("-password");
    res.json({ msg: "Phone updated successfully", user: safeUser });
  } catch (error) {
    console.error("❌ Error updating phone:", error.message);
    res.status(500).json({ msg: "Server error while updating phone" });
  }
};
