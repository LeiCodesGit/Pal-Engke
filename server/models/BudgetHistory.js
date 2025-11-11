import mongoose from "mongoose";

const BudgetHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true }
});

export default mongoose.model("BudgetHistory", BudgetHistorySchema);
