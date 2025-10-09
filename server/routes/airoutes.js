import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/suggest-meal", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.trim() === "") {
      return res.status(400).json({ error: "No ingredients provided." });
    }

    console.log("🧂 Ingredients received:", ingredients);

    // ✅ Step 1: Check if input is about food
    const checkResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict classifier that checks if a user input contains food, ingredients, or cooking-related items. Only reply 'yes' or 'no'.",
        },
        {
          role: "user",
          content: `Does this input describe food, ingredients, or something edible? Answer only 'yes' or 'no': ${ingredients}`,
        },
      ],
    });

    const checkResult = checkResponse.choices[0]?.message?.content?.trim().toLowerCase();
    console.log("🔍 Food check result:", checkResult);

    if (!checkResult.includes("yes")) {
      return res.json({ suggestion: "❌ This doesn't seem like a meal or food-related input." });
    }

    // ✅ Step 2: Generate meal suggestion in bullet form
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Filipino meal suggestion assistant." },
        {
          role: "user",
          content: `Given these ingredients: ${ingredients}, suggest a Filipino meal that can be cooked with them. 
                    Format the answer like this:
                    "You can make [MEAL NAME] with the following ingredients! Here's how:
                    - Step 1...
                    - Step 2...
                    - Step 3..."`,
        },
      ],
    });

    const suggestion =
      chatResponse.choices[0]?.message?.content?.trim() || "No suggestion found.";

    console.log("✅ Suggestion generated:", suggestion);

    res.json({ suggestion });
  } catch (error) {
    console.error("❌ AI Route Error:", error);
    res.status(500).json({ error: "AI request failed", details: error.message });
  }
});

export default router;
