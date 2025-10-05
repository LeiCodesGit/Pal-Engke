import express from "express";
const userRouter = express.Router();

// Palengke page
userRouter.get("/palengke", (req, res) => {
    res.render("users/palengke");
});

// Community page
userRouter.get("/community", (req, res) => {
    res.render("users/community");
});

export default userRouter;
