import express from "express";
import upload from "../middlewares/upload.js"; // your multer middleware
import User from "../models/User.js";

const profileRouter = express.Router();

// View profile
profileRouter.get("/", async (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect("/auth/login");

    res.render("profile", { user });
});

// ✅ Edit profile route
profileRouter.post("/edit", upload.single("profile_picture"), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { firstName, lastName, contactNumber, age } = req.body;

        const updatedData = { firstName, lastName, contactNumber, age };

        // Handle profile picture upload (in memory)
        if (req.file) {
        updatedData.profile_picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        }

        // Update user in MongoDB
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

        // Update session
        req.session.user = {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber,
        age: updatedUser.age,
        userType: updatedUser.userType,
        profile_picture: updatedUser.profile_picture
        };

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
});

export default profileRouter;
