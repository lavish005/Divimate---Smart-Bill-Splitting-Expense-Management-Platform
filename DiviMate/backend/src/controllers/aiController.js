import { extractTextFromImage, classifyFoodItem, parseMenuText } from "../services/aiService.js";
import fs from "fs";
import { calculateBillSplit } from "../utils/splitCalculator.js";
import { calculateWhoOwesWhom } from "../utils/paymentBalancer.js";
import Group from "../models/Group.js";

export const analyzeMenu = async (req, res) => {
  try {
    console.log("\n🤖 [AI MENU ANALYZER] Request received");
    console.log("👤 User:", req.user?.name || "Unknown");
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (!req.file) {
      console.log("❌ [AI] No image file uploaded");
      return res.status(400).json({ msg: "Menu image is required." });
    }

    const imagePath = req.file.path.replace(/\\/g, "/"); // Fix Windows path
    console.log("� [AI] Image uploaded:", req.file.filename);
    console.log("🚀 [AI] Starting full AI pipeline...");
    console.log("🟎 [AI] Step 1/4: OCR Text Extraction...");

    // 1️⃣ OCR
    const text = await extractTextFromImage(imagePath);
    console.log("✅ [AI] OCR completed. Text length:", text.length);
    console.log("📝 [AI] Raw OCR text:\n", text);

    // 2️⃣ Clean & extract valid dish lines with prices
    console.log("🟎 [AI] Step 2/4: Parsing menu text with prices...");
    const parsedItems = parseMenuText(text);
    console.log("✅ [AI] Found", parsedItems.length, "items with prices");

    if (parsedItems.length === 0) {
      // Clean up uploaded file
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      return res.status(400).json({ 
        msg: "Could not extract any items with prices from the image. Please upload a clearer menu/bill image.",
        rawText: text
      });
    }

    // 3️⃣ AI classification
    console.log("🟎 [AI] Step 3/4: Classifying food items (Veg/Non-Veg)...");
    const results = [];
    for (const parsed of parsedItems) {
      const category = await classifyFoodItem(parsed.item);
      results.push({ 
        item: parsed.item, 
        category, 
        price: parsed.price 
      });
      console.log(`  → ${parsed.item}: ₹${parsed.price} (${category})`);
    }
    console.log("✅ [AI] Classification complete for all items");

    // 4️⃣ Get real group members from DB
    console.log("🟎 [AI] Step 4/4: Smart bill splitting...");
    const { groupId, paidByName, paidByUserId } = req.body;

    if (!groupId) {
      return res.status(400).json({ msg: "Group ID is required." });
    }

    // populate member.userId to access canonical dietType; fall back to stored type
    const group = await Group.findById(groupId).populate("members.userId", "name dietType");
    if (!group) {
      return res.status(404).json({ msg: "Group not found." });
    }

    const friends = group.members.map((m) => ({
      name: m.name || m.userId?.name,
      type: m.type || m.userId?.dietType || "Veg",
      userId: m.userId?._id?.toString() || m.userId?.toString(),
    }));

    console.log("👥 [AI] Group:", group.name);
    console.log("👥 [AI] Members:", friends.length);

    // 5️⃣ Smart AI Auto-Split 💰
    const split = calculateBillSplit(results, friends);

    // 6️⃣ Who paid — the total bill is the sum of all detected item prices
    const totalBill = results.reduce((sum, r) => sum + r.price, 0);

    // Resolve payer name: from form field, or look up by userId
    let resolvedPayerName = paidByName;
    if (!resolvedPayerName && paidByUserId) {
      const payerFriend = friends.find((f) => f.userId === paidByUserId);
      resolvedPayerName = payerFriend?.name;
    }

    const paidBy = {};
    if (resolvedPayerName) {
      paidBy[resolvedPayerName] = totalBill; // Payer paid the entire bill
    }
    const paymentSummary = calculateWhoOwesWhom(split, friends, paidBy);

    // 7️⃣ Clean up uploaded file
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    console.log("🗑️ [AI] Uploaded image deleted");

    console.log("✅ [AI MENU ANALYSIS COMPLETE]");
    console.log("📝 Items analyzed:", results.length);
    console.log("💵 Total bill: ₹", totalBill);
    console.log("==========================================\n");

    // 8️⃣ Respond
    res.json({
      msg: "Menu analyzed, split, and balances calculated successfully",
      group: group.name,
      items: results,
      split,
      paymentSummary
    });

  } catch (error) {
    console.error("❌ Analyze menu error:", error.message);
    res.status(500).json({ msg: "Failed to analyze menu" });
  }
};
