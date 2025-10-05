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

homeRouter.get("/palengke", (req, res) => {
    res.render("palengke");
});

// Community page
homeRouter.get("/community", (req, res) => {
    res.render("community");
});

export default homeRouter;
