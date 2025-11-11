import cron from "node-cron";
import User from "../models/User.js";
import BudgetHistory from "../models/BudgetHistory.js";

function getLastWeekDateRange() {
  const now = new Date();
  const weekEnd = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - 7));
  return { weekStart, weekEnd };
}

// Runs every Sunday at 12:00 AM
cron.schedule("0 0 * * 0", async () => {
  const users = await User.find({});

  for (const user of users) {
    if (user.currentBudget > 0) {
      const { weekStart, weekEnd } = getLastWeekDateRange();

      await BudgetHistory.create({
        userId: user._id,
        amount: user.currentBudget,
        weekStart,
        weekEnd
      });
    }

    user.currentBudget = 0;
    await user.save();
  }

  console.log("✅ Weekly Budget Reset Done");
});
