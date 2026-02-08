// src/index.js

import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";

import { Server } from "socket.io";
import { pipeline } from "@xenova/transformers";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, { cors: { origin: "*" } });

// Attach io to req for any controller (expenses, notifications, etc.)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // so frontend can access menu images if needed

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settlements", settlementRoutes);


app.get("/", (req, res) => {
  res.send("✅ DiviMate Backend with Realtime Running...");
});

// SOCKET CONNECTIONS
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Joining group rooms
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`👥 User joined group ${groupId}`);
  });

  // Register logged-in user for notifications
  socket.on("registerUser", (userId) => {
    socket.join(userId);
    console.log(`🔔 Notifications enabled for User: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// PRELOAD AI MODEL
(async () => {
  try {
    console.log("⏳ Preloading AI model for Veg/Non-Veg classification...");
    await pipeline("zero-shot-classification", "Xenova/mobilebert-uncased-mnli");
    console.log("✅ Local AI model cached and ready!");
  } catch (err) {
    console.error("❌ Failed to preload local AI model:", err.message);
  }
})();

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
