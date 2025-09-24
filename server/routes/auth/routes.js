
import bcrypt from "bcrypt";
import express from "express";
import User from "../../models/User.js";

const authRouter = express.Router();

//render login page
authRouter.get("/login", (req, res) => {
    res.render("auth/login"); 
});

//render register page
authRouter.get("/register", (req, res) => {
    res.render("auth/register");
});

//register new users
authRouter.post("/register", async (req, res) => {
    const {
        userType,
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        age
    } = req.body;

    try {
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({message: "Email already exist"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            userType,
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            age
        });

        //check new generated user:
        console.log("new user _id:")
        res.status(201).json({
            message: "User created successfully",
            userId: newUser._id
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Registration Failed",
            error: error.message
        });
    }
});

export default authRouter;
