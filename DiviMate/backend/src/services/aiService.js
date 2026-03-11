import Tesseract from "tesseract.js";
import dotenv from "dotenv";
import fs from "fs";
import { pipeline } from "@xenova/transformers";

dotenv.config();

/* -------------------------------------------------------------------------- */
/* 🧠 Global variable for local model (cached after first load)                */
/* -------------------------------------------------------------------------- */
let classifier = null;

/* -------------------------------------------------------------------------- */
/* 🧩 1️⃣ Extract Text from Image (OCR)                                         */
/* -------------------------------------------------------------------------- */
export const extractTextFromImage = async (imagePath) => {
  try {
    console.log("🟢 Starting OCR for:", imagePath);

    const { data: { text } } = await Tesseract.recognize(imagePath, "eng", {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₹$Rs -.,()/",
      psm: 6, // one uniform block of text
    });

    console.log("✅ OCR Completed");
    return text;
  } catch (error) {
    console.error("❌ OCR Error:", error.message);
    throw new Error("Failed to read text from image");
  }
};

/* -------------------------------------------------------------------------- */
/* 🧩 2️⃣ AI Classification (local zero-shot model + fallback)                 */
/* -------------------------------------------------------------------------- */
export const classifyFoodItem = async (item) => {
  const lower = item.toLowerCase();

  // quick offline rules
  const nonVegHints = ["chicken","mutton","egg","fish","prawn","crab","beef","meat"];
  const vegHints = ["paneer","tofu","mushroom","veg","vegetable","aloo","dal","chana","palak","bhindi"];

  if (nonVegHints.some(w => lower.includes(w))) return "Non-Veg";
  if (vegHints.some(w => lower.includes(w))) return "Veg";

  try {
    // Lazy-load the model once
    if (!classifier) {
      console.log("🧠 Loading local zero-shot model (this may take ~30s the first time)...");
      classifier = await pipeline("zero-shot-classification", "Xenova/mobilebert-uncased-mnli");
      console.log("✅ Local model loaded and cached");
    }

    const result = await classifier(item, ["Vegetarian", "Non-Vegetarian"]);
    const label = result?.labels?.[0];
    if (!label) return "Unknown";

    if (label.toLowerCase().includes("vegetarian")) return "Veg";
    if (label.toLowerCase().includes("non")) return "Non-Veg";
    return "Unknown";
  } catch (err) {
    console.error("❌ Local AI error:", err.message);
    return "Unknown";
  }
};

/* -------------------------------------------------------------------------- */
/* 🧩 3️⃣ Parse menu text WITH prices (clean OCR lines)                       */
/* -------------------------------------------------------------------------- */
export const parseMenuText = (text) => {
  const excludeWords = [
    "soups", "main course", "desserts", "starters", "beverages", "drinks",
    "menu", "markdown", "cafe", "restaurant", "specials", "today", "combo",
    "total", "subtotal", "tax", "gst", "cgst", "sgst", "service", "charge",
    "discount", "table", "bill", "invoice", "order", "date", "time", "qty"
  ];

  const results = [];

  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 2);

  for (const line of lines) {
    // Skip headers/categories
    if (excludeWords.some(w => line.toLowerCase().includes(w))) continue;

    // Try to extract price from line
    // Patterns: "₹199", "Rs.199", "Rs 199", "199.00", "199/-", just "199" at end
    const pricePatterns = [
      /₹\s*(\d+(?:\.\d{1,2})?)/,           // ₹199 or ₹ 199
      /Rs\.?\s*(\d+(?:\.\d{1,2})?)/i,      // Rs.199, Rs 199
      /INR\s*(\d+(?:\.\d{1,2})?)/i,        // INR 199
      /(\d+(?:\.\d{1,2})?)\s*\/-/,         // 199/-
      /(\d{2,4}(?:\.\d{1,2})?)\s*$/,       // 199 or 199.00 at end of line
      /\s(\d{2,4}(?:\.\d{1,2})?)\s/,       // number in middle with spaces
    ];

    let price = null;
    let priceMatch = null;

    for (const pattern of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        const extracted = parseFloat(match[1]);
        // Valid price range: ₹10 to ₹9999
        if (extracted >= 10 && extracted <= 9999) {
          price = extracted;
          priceMatch = match[0];
          break;
        }
      }
    }

    // Extract item name by removing price portion
    let itemName = line;
    if (priceMatch) {
      itemName = line.replace(priceMatch, "");
    }

    // Clean item name
    itemName = itemName
      .replace(/[₹$]/g, "")                // remove currency symbols
      .replace(/Rs\.?/gi, "")              // remove Rs
      .replace(/\d+\.\d{2}/g, "")          // remove remaining decimals
      .replace(/\d{3,}/g, "")              // remove long numbers (likely prices)
      .replace(/[^a-zA-Z\s\-]/g, " ")      // keep only letters, spaces, hyphens
      .replace(/\s+/g, " ")                // collapse spaces
      .trim();

    // Skip if name is too short or no meaningful content
    if (itemName.length < 3) continue;

    // Skip if it looks like just numbers/noise
    const wordCount = itemName.split(" ").filter(w => w.length > 1).length;
    if (wordCount === 0) continue;

    // If no price found, skip this line (likely a header)
    if (price === null) continue;

    results.push({
      item: itemName,
      price: Math.round(price)
    });
  }

  // Remove duplicates by item name
  const seen = new Set();
  const uniqueResults = results.filter(r => {
    const key = r.item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueResults;
};
