export const handleSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("\n🟢 [SOCKET HANDLER] User connected");
    console.log("🆔 Socket ID:", socket.id);
    console.log("⏰ Time:", new Date().toISOString());

    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log("👥 [SOCKET] User", socket.id, "joined group:", groupId);
    });

    socket.on("expenseAdded", (data) => {
      console.log("💰 [SOCKET] Expense added event received:", data.groupId);
      io.to(data.groupId).emit("updateExpenses", data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 [SOCKET HANDLER] User disconnected:", socket.id);
      console.log("⏰ Time:", new Date().toISOString());
    });
  });
};
