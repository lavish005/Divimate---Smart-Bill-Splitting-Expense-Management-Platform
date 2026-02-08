import { extractTextFromImage, classifyFoodItem, parseMenuText } from "../services/aiService.js";
import fs from "fs";
import { calculateBillSplit } from "../utils/splitCalculator.js";
import { calculateWhoOwesWhom } from "../utils/paymentBalancer.js";
import Group from "../models/Group.js";

export const analyzeMenu = async (req, res) => {
  try {
    const imagePath = req.file.path.replace(/\\/g, "/"); // Fix Windows path
    console.log("🟢 Starting full AI pipeline...");

    // 1️⃣ OCR
    const text = await extractTextFromImage(imagePath);

    // 2️⃣ Clean & extract valid dish lines
    const items = parseMenuText(text);

    // 3️⃣ AI classification
    const results = [];
    for (const item of items) {
      const category = await classifyFoodItem(item);
      // temporary price until OCR price extraction added
      const price = Math.floor(Math.random() * 200) + 100; // ₹100–₹300
      results.push({ item, category, price });
    }

    // 4️⃣ Get real group members from DB
    const { groupId, paidByName, paidAmount } = req.body;

    if (!groupId) {
      return res.status(400).json({ msg: "Group ID is required." });
    }

    // populate member details (name + dietType) from User model
    const group = await Group.findById(groupId).populate("members", "name dietType");
    if (!group) {
      return res.status(404).json({ msg: "Group not found." });
    }

    const friends = group.members.map(m => ({
      name: m.name,
      type: m.dietType || "Veg"
    }));

    // 5️⃣ Smart AI Auto-Split 💰
    const split = calculateBillSplit(results, friends);

    // 6️⃣ Who paid and who owes
    const paidBy = {};
    if (paidByName && paidAmount) {
      paidBy[paidByName] = Number(paidAmount);
    }
    const paymentSummary = calculateWhoOwesWhom(split, friends, paidBy);

    // 7️⃣ Clean up uploaded file
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

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
