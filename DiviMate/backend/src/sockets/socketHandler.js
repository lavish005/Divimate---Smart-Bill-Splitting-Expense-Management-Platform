export const handleSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`User joined group: ${groupId}`);
    });

    socket.on("expenseAdded", (data) => {
      io.to(data.groupId).emit("updateExpenses", data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};
