import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

import authRouter from "./routes/auth/routes.js";
const app = express();
const port = process.env.PORT || 4000;  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//public folder for static files
app.use(express.static("public"));

//routes:
app.use("/auth", authRouter);

app.get("/", (req, res) => {
    res.redirect("/auth/login");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Login at http://localhost:${port}/auth/login`);
});