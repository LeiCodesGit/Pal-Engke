import express from "express";
import upload from "../middlewares/upload.js"; // your multer middleware
import User from "../models/User.js";

const profileRouter = express.Router();

// View profile
profileRouter.get("/", async (req, res) => {
    const user = req.session?.user || req.user;
    if (!user) return res.redirect("/auth/login");

    res.render("profile", { user });
});


// Edit profile route
profileRouter.post("/edit", upload.single("profile_picture"), async (req, res) => {
    try {
        const userId = req.session?.user?._id || req.session?.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

        const { firstName, lastName, contactNumber, age } = req.body;

        // Find and update user
        const user = await User.findById(userId);
        if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (contactNumber !== undefined) user.contactNumber = contactNumber;
        if (age !== undefined) user.age = age;

        // Handle profile picture upload
        if (req.file) {
        user.profile_picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        }

        await user.save();

        // ✅ Refresh session for both local and Google users
        req.session.user = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        age: user.age,
        userType: user.userType,
        profile_picture: user.profile_picture,
        };

        res.json({ success: true, user });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
});



export default profileRouter;
