import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
    //test if server is running
    res.send("Server is running");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});