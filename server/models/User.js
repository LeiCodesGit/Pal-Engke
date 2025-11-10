import { Schema, model } from "mongoose";
import fs from "fs";
import path from "path";

const defaultImagePath = path.resolve("public/images/default-profile.png");
let defaultProfileBase64 = null;

try {
    const imageBuffer = fs.readFileSync(defaultImagePath);
    const base64 = imageBuffer.toString("base64");
    defaultProfileBase64 = `data:image/png;base64,${base64}`;
} catch (error) {
    console.error("Could not load default profile image:", error);
}

const userSchema = new Schema(
    {
        userType: {
        type: String,
        enum: ["admin", "user", "premium_user"],
        required: true,
        default: "user",
        },

        profile_picture: {
        type: String,
        required: true,
        default: defaultProfileBase64,
        },

        firstName: {
        type: String,
        required: true,
        trim: true,
        },

        lastName: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        trim: true,
        },

        email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        },

        contactNumber: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        },

        password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        },

        age: {
        type: Number,
        required: function () {
            return !this.googleId;
        },
        min: 0,
        },

        budget: {
        weekly: { type: Number, default: 0 },
        savingsGoal: { type: Number, default: 0 },
        },

        googleId: {
        type: String,
        default: null,
        },
    },
    { timestamps: true }
);

const User = model("User", userSchema);
export default User;
