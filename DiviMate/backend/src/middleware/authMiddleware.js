import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ msg: "Unauthorized" });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(404).json({ msg: "User not found" });

    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ msg: "Token invalid or expired" });
  }
};

export default authMiddleware;
