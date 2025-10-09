import express from "express";
const homeRouter = express.Router();

// Home page
homeRouter.get("/", (req, res) => {
  const user = req.session?.user || null;
  res.render("home", { user });
});

// Meals page
homeRouter.get("/meals", (req, res) => {
  const user = req.session?.user || null;
  res.render("meals", { user });
});

// Profile page
homeRouter.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  res.render("profile", { user: req.session.user });
});

// Palengke page
homeRouter.get("/palengke", (req, res) => {
  const user = req.session?.user || null;
  res.render("palengke", { user });
});

// Community page
homeRouter.get("/community", (req, res) => {
  const user = req.session?.user || null;
  res.render("community", { user });
});

export default homeRouter;
