// src/index.js

import "dotenv/config"; // Auto-loads .env before any other code

import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

import { Server } from "socket.io";
import { pipeline } from "@xenova/transformers";
import schedule from "node-schedule";
import { runWeeklyReminders } from "./jobs/weeklyReminder.js";

console.log("\n" + "=".repeat(50));
console.log("🚀 DiviMate Backend Server Initializing...");
console.log("=".repeat(50));
console.log("⏰ Server Start Time:", new Date().toISOString());
console.log("🔧 Environment:", process.env.NODE_ENV || "development");
console.log("=".repeat(50) + "\n");

connectDB();

const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, { cors: { origin: "*" } });

console.log("✅ [SOCKET.IO] Socket.IO server initialized");

// Attach io to req for any controller (expenses, notifications, etc.)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // so frontend can access menu images if needed

// ✅ Request Logger Middleware - Log every incoming request
app.use((req, res, next) => {
  console.log("\n🌐 [HTTP REQUEST]");
  console.log("📍 Method:", req.method);
  console.log("🔗 URL:", req.originalUrl);
  console.log("🕐 Time:", new Date().toLocaleString());
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", JSON.stringify(req.body).substring(0, 200));
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log("🔍 Query:", JSON.stringify(req.query));
  }
  next();
});

console.log("✅ [MIDDLEWARE] CORS, JSON parser, request logger, and static file middleware configured");

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/chat", chatRoutes);

console.log("✅ [ROUTES] API routes registered:");
console.log("  ➡️ /api/users");
console.log("  ➡️ /api/groups");
console.log("  ➡️ /api/expenses");
console.log("  ➡️ /api/ai");
console.log("  ➡️ /api/admin");
console.log("  ➡️ /api/notifications");
console.log("  ➡️ /api/settlements");
console.log("  ➡️ /api/chat\n");


app.get("/", (req, res) => {
  res.send("✅ DiviMate Backend with Realtime Running...");
});

// SOCKET CONNECTIONS
io.on("connection", (socket) => {
  console.log("\n🟢 [SOCKET] User connected");
  console.log("🆔 Socket ID:", socket.id);
  console.log("⏰ Time:", new Date().toISOString());

  // Joining group rooms
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log("👥 [SOCKET] User joined group:", groupId);
  });

  // Register logged-in user for notifications
  socket.on("registerUser", (userId) => {
    socket.join(userId);
    console.log("🔔 [SOCKET] Notifications enabled for User:", userId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      console.log("💬 [SOCKET] sendMessage received:", {
        groupId: data.groupId,
        senderId: data.senderId,
        text: data.text?.substring(0, 50)
      });
      const Message = (await import("./models/Message.js")).default;
      const Group = (await import("./models/Group.js")).default;
      const group = await Group.findById(data.groupId);
      if (!group) return;

      const member = group.members.find(
        (m) => m.userId.toString() === data.senderId
      );
      if (!member || member.blocked) return;

      const msg = await Message.create({
        group: data.groupId,
        sender: data.senderId,
        text: data.text,
      });
      const populated = await msg.populate("sender", "name");
      io.to(data.groupId).emit("newMessage", populated);
      console.log("✅ [SOCKET] Message broadcasted to group:", data.groupId);
    } catch (err) {
      console.error("❌ Socket sendMessage error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 [SOCKET] User disconnected:", socket.id);
    console.log("⏰ Time:", new Date().toISOString());
  });
});

// PRELOAD AI MODEL
(async () => {
  try {
    console.log("\n⏳ [AI MODEL] Starting to preload AI model...");
    console.log("🤖 Model: Xenova/mobilebert-uncased-mnli");
    console.log("🎯 Purpose: Veg/Non-Veg classification");
    await pipeline("zero-shot-classification", "Xenova/mobilebert-uncased-mnli");
    console.log("✅ [AI MODEL] Local AI model cached and ready!");
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ [AI MODEL] Failed to preload:", err.message);
  }
})();

// WEEKLY REMINDER CRON — Every Monday at 9 AM
schedule.scheduleJob("0 9 * * 1", () => {
  console.log("\n📅 [CRON JOB] Running weekly payment reminders...");
  console.log("⏰ Time:", new Date().toISOString());
  runWeeklyReminders();
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 SERVER SUCCESSFULLY STARTED!");
  console.log("=".repeat(50));
  console.log("🌐 Server URL: http://localhost:" + PORT);
  console.log("🔌 Port:", PORT);
  console.log("⏰ Started at:", new Date().toLocaleString());
  console.log("=".repeat(50));
  console.log("✅ All systems operational!");
  console.log("🟢 Ready to accept connections...");
  console.log("=".repeat(50) + "\n");
});
