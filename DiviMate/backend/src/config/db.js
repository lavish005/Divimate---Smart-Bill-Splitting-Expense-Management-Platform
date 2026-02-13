import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("\n🔗 [DATABASE] Connecting to MongoDB...");
    console.log("📍 URI:", process.env.MONGO_URI?.substring(0, 20) + "...");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 [DATABASE] MongoDB Connected Successfully!");
    console.log("🖥️ Host:", conn.connection.host);
    console.log("💾 Database:", conn.connection.name);
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
