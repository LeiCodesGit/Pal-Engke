import express from "express";
const homeRouter = express.Router();

// Home page
homeRouter.get("/home", (req, res) => {
  res.render("home");
});

// Meals page
homeRouter.get("/meals", (req, res) => {
  res.render("meals");
});

homeRouter.get("/profile", (req, res) => {
  // Check if logged in
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  // Pass the session user to EJS
  res.render("profile", { user: req.session.user });
});

export default homeRouter;
