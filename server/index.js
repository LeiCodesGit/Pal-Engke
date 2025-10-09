import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
dotenv.config();
import connect from "./mongodb-connect.js";  
import session from "express-session";

import authRouter from "./routes/auth/routes.js";
import homeRouter from "./routes/homeroutes.js";
import aiRouter from "./routes/airoutes.js";  
const app = express();
const port = process.env.PORT || 4000;  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connect(); //connect to database

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,          // set to true only if using HTTPS
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));


app.use(express.urlencoded({ extended: true }));

//set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//public folder for static files
app.use(express.static("public"));

//routes:
app.use("/auth", authRouter);
app.use("/", homeRouter)
app.use("/api", aiRouter);  

app.get("/", (req, res) => {
    res.redirect("/auth/login");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Login at http://localhost:${port}/auth/login`);
});