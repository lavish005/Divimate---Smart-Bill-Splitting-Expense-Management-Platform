import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  sendPhoneOtpEmail,
  sendRegistrationOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetOtpEmail,
  sendPasswordChangedEmail
} from "../services/notificationService.js";

// Helper: Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===============================
// 🔐 STEP 1: Send Registration OTP
// ===============================
export const sendRegisterOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    console.log("\n📧 [REGISTRATION OTP] Request started");
    console.log("📧 Email:", email);
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Check if email already registered and verified
    const existing = await User.findOne({ email });
    if (existing && existing.emailVerified) {
      console.log("❌ [REGISTRATION OTP] Email already registered:", email);
      return res.status(400).json({ msg: "Email already registered. Please login." });
    }

    const otp = generateOtp();
    console.log("🔑 [DEBUG] Generated OTP:", otp); // Debug log - remove in production
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existing) {
      // Update existing unverified user
      existing.emailOtpHash = otpHash;
      existing.emailOtpExpiresAt = otpExpiry;
      await existing.save();
    } else {
      // Create temporary user record
      await User.create({
        name: name || "User",
        email,
        password: "temp_password", // Will be set during verification
        emailOtpHash: otpHash,
        emailOtpExpiresAt: otpExpiry,
        emailVerified: false
      });
    }

    const emailSent = await sendRegistrationOtpEmail(email, otp, name);
    
    if (!emailSent) {
      return res.status(500).json({ msg: "Failed to send OTP email. Please try again." });
    }

    console.log("✅ [REGISTRATION OTP] OTP sent to:", email);
    res.json({ msg: "OTP sent to your email", email });
  } catch (error) {
    console.error("❌ Registration OTP error:", error.message);
    res.status(500).json({ msg: "Server error while sending OTP" });
  }
};

// ===============================
// ✅ STEP 2: Verify OTP & Complete Registration
// ===============================
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp, name, password, dietType } = req.body;
    console.log("\n🔐 [VERIFY REGISTRATION] Attempt started");
    console.log("📧 Email:", email);
    console.log("🔑 OTP received:", otp);
    console.log("⏰ Timestamp:", new Date().toISOString());

    // Clean the OTP - remove whitespace and ensure it's a string
    const cleanOtp = String(otp).trim();

    if (!email || !cleanOtp || !password) {
      return res.status(400).json({ msg: "Email, OTP, and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "No registration found for this email. Please request OTP first." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ msg: "Email already verified. Please login." });
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ msg: "OTP not requested. Please request a new OTP." });
    }

    if (user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ msg: "OTP expired. Please request a new one." });
    }

    console.log("🔍 Comparing OTP...");
    console.log("   OTP Hash exists:", !!user.emailOtpHash);
    
    const isMatch = await bcrypt.compare(cleanOtp, user.emailOtpHash);
    console.log("   OTP Match result:", isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid OTP. Please check and try again." });
    }

    // Complete registration
    const hashedPassword = await bcrypt.hash(password, 10);
    user.name = name || user.name;
    user.password = hashedPassword;
    user.dietType = dietType || "Veg";
    user.emailVerified = true;
    user.emailOtpHash = "";
    user.emailOtpExpiresAt = null;
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const safeUser = await User.findById(user._id).select("-password -emailOtpHash -phoneOtpHash -passwordResetOtpHash");

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, user.name);

    console.log("✅ [REGISTRATION SUCCESS] User verified and registered");
    console.log("🆔 User ID:", user._id);
    console.log("📧 Email:", email);

    res.status(201).json({
      msg: "Registration successful! Welcome to DiviMate.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Verify registration error:", error.message);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

// ===============================
// 🆕 Legacy Register (without OTP - kept for compatibility)
// ===============================
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
      dietType: dietType || "Veg",
      emailVerified: true // Legacy registration is auto-verified
    });

    const safeUser = await User.findById(newUser._id).select("-password");

    // Send welcome email
    sendWelcomeEmail(email, name);

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

// ===============================
// 🔑 FORGOT PASSWORD: Send Reset OTP
// ===============================
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("\n🔑 [PASSWORD RESET OTP] Request started");
    console.log("📧 Email:", email);

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ msg: "If this email is registered, you will receive a reset code." });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendPasswordResetOtpEmail(email, otp, user.name);

    console.log("✅ [PASSWORD RESET OTP] Sent to:", email);
    res.json({ msg: "If this email is registered, you will receive a reset code." });
  } catch (error) {
    console.error("❌ Password reset OTP error:", error.message);
    res.status(500).json({ msg: "Server error while sending reset code" });
  }
};

// ===============================
// 🔐 RESET PASSWORD: Verify OTP & Change Password
// ===============================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log("\n🔐 [PASSWORD RESET] Attempt started");
    console.log("📧 Email:", email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ msg: "Reset code not requested. Please request a new one." });
    }

    if (user.passwordResetOtpExpiresAt < new Date()) {
      return res.status(400).json({ msg: "Reset code expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.passwordResetOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid reset code" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOtpHash = "";
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    // Send confirmation email
    sendPasswordChangedEmail(email, user.name);

    console.log("✅ [PASSWORD RESET] Password changed for:", email);
    res.json({ msg: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    console.error("❌ Password reset error:", error.message);
    res.status(500).json({ msg: "Server error while resetting password" });
  }
};

// ===============================
// 🔄 RESEND OTP (for registration or password reset)
// ===============================
export const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'registration' or 'password-reset'
    console.log("\n🔄 [RESEND OTP] Request for:", type);
    console.log("📧 Email:", email);

    if (!email || !type) {
      return res.status(400).json({ msg: "Email and type are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (type === 'registration') {
      if (user.emailVerified) {
        return res.status(400).json({ msg: "Email already verified. Please login." });
      }
      user.emailOtpHash = otpHash;
      user.emailOtpExpiresAt = otpExpiry;
      await user.save();
      await sendRegistrationOtpEmail(email, otp, user.name);
    } else if (type === 'password-reset') {
      user.passwordResetOtpHash = otpHash;
      user.passwordResetOtpExpiresAt = otpExpiry;
      await user.save();
      await sendPasswordResetOtpEmail(email, otp, user.name);
    } else {
      return res.status(400).json({ msg: "Invalid OTP type" });
    }

    console.log("✅ [RESEND OTP] New OTP sent to:", email);
    res.json({ msg: "New OTP sent to your email" });
  } catch (error) {
    console.error("❌ Resend OTP error:", error.message);
    res.status(500).json({ msg: "Server error while resending OTP" });
  }
};
