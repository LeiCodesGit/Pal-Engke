import express from "express";
const homeRouter = express.Router();

// Home page
homeRouter.get("/", (req, res) => {
  res.render("home");
});

// Meals page
homeRouter.get("/meals", (req, res) => {
  res.render("meals");
});

export default homeRouter;
