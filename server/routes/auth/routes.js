
import bcrypt from "bcrypt";
import express from "express";
import User from "../../models/User.js";
import passport from "../../config/passport.js";

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
            return res.status(409).json({message: "Email already exists"});
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

        return res.status(201).json({
            message: "Registration successful",
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                userType: newUser.userType
            }
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

//User login
authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(401).render("auth/login", { error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(401).render("auth/login", { error: "Invalid email or password" });
        }

        // Store user in session
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            contactNumber: user.contactNumber,
            age: user.age,
            userType: user.userType
        };

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).render("auth/login", { error: "Server error" });
    }
});

//User logout
authRouter.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
        }

        res.clearCookie("connect.sid"); // clear session cookie
        res.redirect("/auth/login");
    });
});

// Google OAuth routes
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/auth/login"
}), (req, res) => {
    req.session.user = {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        userType: req.user.userType
    };

    res.redirect("/home");
});

export default authRouter;
