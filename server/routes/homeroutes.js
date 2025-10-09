import express from "express";
const homeRouter = express.Router();

// Home page
homeRouter.get("/", (req, res) => {
  const user = req.user || null; // If no logged-in user, default to null
  res.render("home", { user });
});

// Meals page
homeRouter.get("/meals", (req, res) => {
  const user = req.user || null;
  res.render("meals", { user });
});

homeRouter.get("/palengke", (req, res) => {
  const user = req.user || null;
  res.render("palengke", { user });
});

// Community page
homeRouter.get("/community", (req, res) => {
  const user = req.user || null;
  res.render("community", { user });
});

export default homeRouter;
