import express from "express";

const authRouter = express.Router();

//render login page
authRouter.get("/login", (req, res) => {
    res.render("auth/login"); 
});

//render register page
authRouter.get("/register", (req, res) => {
    res.render("auth/register");
});

export default authRouter;
