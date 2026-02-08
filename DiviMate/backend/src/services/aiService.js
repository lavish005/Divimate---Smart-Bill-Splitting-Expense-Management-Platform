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
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,()",
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
/* 🧩 3️⃣ Parse menu text (clean OCR lines)                                   */
/* -------------------------------------------------------------------------- */
export const parseMenuText = (text) => {
  const excludeWords = [
    "soups", "main course", "desserts", "starters", "beverages", "drinks",
    "menu", "markdown", "cafe", "restaurant", "specials", "today", "combo"
  ];

  const lines = text
    .split("\n")
    .map(line => 
      line
        .replace(/[0-9₹$.]/g, "")          // remove prices & symbols
        .replace(/[^a-zA-Z\s]/g, "")       // remove random special chars
        .replace(/\s+/g, " ")              // collapse extra spaces
        .trim()
    )
    .filter(line => line.length > 2)       // ignore tiny words
    .filter(line => !excludeWords.some(w => line.toLowerCase().includes(w)))
    .filter((line, index, self) => self.indexOf(line) === index);

  // 🧽 extra step: remove trailing 1-4 random letters (noise)
  const cleanedLines = lines.map(l => {
    const words = l.split(" ");
    if (words.length > 1) {
      const last = words[words.length - 1];
      if (last.length <= 4 && !["veg","non","soup","rice","paneer"].includes(last.toLowerCase())) {
        words.pop(); // remove short trailing word (likely noise)
      }
    }
    return words.join(" ");
  });

  return cleanedLines;
};
