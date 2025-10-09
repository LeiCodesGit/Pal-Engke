import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connect from "./mongodb-connect.js";
import session from "express-session";
import passport from "./config/passport.js";

import authRouter from "./routes/auth/routes.js";
import homeRouter from "./routes/homeroutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connect(); // connect to database

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize session first
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60, // 1 hour
        },
    })
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static("public"));

// Routes
app.use("/auth", authRouter);
app.use("/", homeRouter);

// Default route
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Login page: http://localhost:${port}/auth/login`);
});
