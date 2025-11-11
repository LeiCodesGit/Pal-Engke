import express from "express";
import BudgetHistory from "../models/BudgetHistory.js";
import User from "../models/User.js";
import redirectIfNotLoggedIn from "../middlewares/redirectIfNotLoggedIn.js";

const router = express.Router();

// Set/Update weekly budget
router.post("/set", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const { userId, weeklyBudget, savingsGoal } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate week boundaries (Sunday to Saturday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Last Sunday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Following Saturday
    weekEnd.setHours(23, 59, 59, 999);

    // Update user budget
    user.budget = {
      weekly: parseFloat(weeklyBudget) || 0,
      remaining: parseFloat(weeklyBudget) || 0,
      savingsGoal: parseFloat(savingsGoal) || 0,
      weekStart: weekStart,
      weekEnd: weekEnd,
      lastReset: now
    };

    await user.save();

    // Save to history
    await BudgetHistory.create({
      userId: user._id,
      amount: user.budget.weekly,
      weekStart: weekStart,
      weekEnd: weekEnd
    });

    res.json({ 
      success: true, 
      budget: user.budget 
    });
  } catch (err) {
    console.error("Error setting budget:", err);
    res.status(500).json({ message: "Failed to set budget", error: err.message });
  }
});

// Update remaining budget (when user spends money)
router.post("/spend", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.budget.remaining = Math.max(0, user.budget.remaining - parseFloat(amount));
    await user.save();

    res.json({ 
      success: true, 
      remaining: user.budget.remaining 
    });
  } catch (err) {
    console.error("Error updating budget:", err);
    res.status(500).json({ message: "Failed to update budget", error: err.message });
  }
});

// Get current budget
router.get("/current/:userId", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if week has ended and reset if needed
    const now = new Date();
    if (user.budget.weekEnd && now > user.budget.weekEnd) {
      // Week ended, reset budget
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      user.budget.remaining = user.budget.weekly;
      user.budget.weekStart = weekStart;
      user.budget.weekEnd = weekEnd;
      user.budget.lastReset = now;
      
      await user.save();
    }

    res.json({ 
      success: true, 
      budget: user.budget 
    });
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).json({ message: "Failed to fetch budget", error: err.message });
  }
});

// Update current budget
router.post("/update", redirectIfNotLoggedIn, async (req, res) => {
  const { userId, amount } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.currentBudget = amount;
  await user.save();

  res.json({ success: true, currentBudget: user.currentBudget });
});

export default router;
