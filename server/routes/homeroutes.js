import express from "express";
import Meal from "../models/Meal.js";
import redirectIfNotLoggedIn from "../middlewares/redirectIfNotLoggedIn.js";

const homeRouter = express.Router();

// Home page with dynamic meals for today
homeRouter.get("/home", redirectIfNotLoggedIn, async (req, res) => {
  const user = req.session?.user || null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    // Fetch meals suggested for today
    const meals = await Meal.find({
      suggestedFor: today
    });

    res.render("home", { user, meals });
  } catch (err) {
    console.error("Failed to fetch today's meals:", err);
    res.render("home", { user, meals: [] });
  }
});

// Meals page 
homeRouter.get("/meals", redirectIfNotLoggedIn, (req, res) => {
  const user = req.session?.user || null;
  res.render("meals", { user });
});

// Profile page
homeRouter.get("/profile", redirectIfNotLoggedIn, (req, res) => {
  res.render("profile", { user: req.session.user });
});

// Palengke page
homeRouter.get("/palengke", redirectIfNotLoggedIn, (req, res) => {
  const user = req.session?.user || null;
  res.render("palengke", { user });
});

export default homeRouter;
