import express from "express";
import BudgetHistory from "../models/BudgetHistory.js";
import User from "../models/User.js";

const router = express.Router();

// Update current budget
router.post("/update", async (req, res) => {
  const { userId, amount } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.currentBudget = amount;
  await user.save();

  res.json({ success: true, currentBudget: user.currentBudget });
});

// Get current budget
router.get("/current/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  res.json({ currentBudget: user.currentBudget });
});

export default router;
