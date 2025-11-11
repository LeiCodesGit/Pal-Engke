import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDesc: {
    type: String,
    required: true
  },
  ingredients: {
    type: [String],
    required: true
  },
  steps: {
    type: [String],
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  time: {
    type: Number, // in minutes
    required: true
  },
  image: {
    type: String,
    required: true
  },
  suggestedFor: {
    type: Date, // the date this meal is suggested for
    required: false
  }
});

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;