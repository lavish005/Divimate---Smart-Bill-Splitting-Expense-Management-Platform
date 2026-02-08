import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, dietType } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      dietType: dietType || "Veg" // 👈 default if not provided
    });

    res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        dietType: newUser.dietType
      },
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
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dietType: user.dietType // 👈 include diet type in response
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ msg: "Server error during login" });
  }
};

// ✅ Get profile (Protected)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching profile" });
  }
};


// ✅ Update diet type (Protected)
export const updateDietType = async (req, res) => {
  try {
    const { dietType } = req.body;

    if (!["Veg", "Non-Veg"].includes(dietType)) {
      return res.status(400).json({ msg: "Invalid diet type. Must be 'Veg' or 'Non-Veg'." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { dietType },
      { new: true }
    ).select("-password");

    res.json({
      msg: "Diet type updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Error updating diet type:", error.message);
    res.status(500).json({ msg: "Server error while updating diet type" });
  }
};
