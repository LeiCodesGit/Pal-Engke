import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        userType: {
        type: String,
        enum: ["admin", "user", "premium_user"],
        required: true,
        default: "user",
        },

        firstName: {
        type: String,
        required: true,
        trim: true,
        },

        lastName: {
        type: String,
        required: function () {
            return !this.googleId; // required only if not a Google user
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

        // Only required for non-Google users
        contactNumber: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        },

        // Only required for non-Google users
        password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        },

        // Only required for non-Google users
        age: {
        type: Number,
        required: function () {
            return !this.googleId;
        },
        min: 0,
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
