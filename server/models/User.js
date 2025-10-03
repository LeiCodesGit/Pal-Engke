import { Schema, model } from "mongoose";

// Create the schema
const userSchema = new Schema(
    {
        userType: {
            type: String,
            enum: ["admin", "user", "premium_user"],
            required: true,
        },

        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
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
            required: true,
        },

        password: {
            type: String,
            required: true,
        },

        age: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { timestamps: true }
);

// Create user model
const User = model("User", userSchema);

export default User;
