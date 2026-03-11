import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearDatabase = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collections = await mongoose.connection.db.collections();
    
    console.log("\n🗑️  Clearing all collections...\n");
    
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`  ✓ Cleared: ${collection.collectionName}`);
    }

    console.log("\n✅ All database collections cleared successfully!");
    
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error.message);
    process.exit(1);
  }
};

clearDatabase();
