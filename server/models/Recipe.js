import mongoose from "mongoose";
const { Schema, model } = mongoose;

const recipeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    image: { type: String, default: null }, // stored as public URL (e.g. /uploads/filename.jpg)
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Recipe = model("Recipe", recipeSchema);
export default Recipe;